<?php
/**
 * Integração SEFAZ - Importação de NF-e
 * Utiliza certificado digital A1 para autenticação
 */

class SEFAZIntegration {
    private $cert_path = '/public_html/gestao/cert.p12';
    private $cert_password = '1234';
    private $soap_url = 'https://nfe.sefaz.sp.gov.br/webservices/NFeConsultaProtocolo4/NFeConsultaProtocolo4.asmx';
    private $pdo;

    public function __construct($pdo) {
        $this->pdo = $pdo;
    }

    /**
     * Extrair chave privada e certificado do arquivo P12
     */
    public function extractCertificate() {
        $certs = [];
        $result = openssl_pkcs12_read(
            file_get_contents($this->cert_path),
            $certs,
            $this->cert_password
        );

        if (!$result) {
            throw new Exception('Erro ao ler certificado: ' . openssl_error_string());
        }

        return $certs;
    }

    /**
     * Importar NF-e via XML
     */
    public function importarNFe($xml_content) {
        try {
            $xml = simplexml_load_string($xml_content);
            
            if (!$xml) {
                throw new Exception('XML inválido');
            }

            // Extrair dados da NF-e
            $nfe_infos = $xml->xpath('//nfe:NFe/nfe:infNFe')[0];
            $ide = $xml->xpath('//nfe:ide')[0];
            $emit = $xml->xpath('//nfe:emit')[0];
            $dest = $xml->xpath('//nfe:dest')[0];
            $det = $xml->xpath('//nfe:det');
            $total = $xml->xpath('//nfe:total/nfe:ICMSTot')[0];

            $chave_nfe = (string)$nfe_infos['Id'];
            $numero = (string)$ide->cNF;
            $serie = (string)$ide->serie;
            $data_emissao = (string)$ide->dhEmi;
            $cnpj_emit = (string)$emit->CNPJ;
            $cnpj_dest = isset($dest->CNPJ) ? (string)$dest->CNPJ : null;
            $valor_total = (float)$total->vNF;

            // Iniciar transação
            $this->pdo->beginTransaction();

            // Inserir NF-e
            $stmt = $this->pdo->prepare("
                INSERT INTO est_nfe (
                    chave_nfe, numero, serie, data_emissao, 
                    cnpj_emitente, cnpj_destinatario, valor_total, 
                    xml_content, status, data_import
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'importada', NOW())
                ON DUPLICATE KEY UPDATE status = 'importada'
            ");

            $stmt->execute([
                $chave_nfe,
                $numero,
                $serie,
                $data_emissao,
                $cnpj_emit,
                $cnpj_dest,
                $valor_total,
                $xml_content
            ]);

            $nfe_id = $this->pdo->lastInsertId();

            // Importar itens da NF-e
            foreach ($det as $item) {
                $prod = $item->xpath('nfe:prod')[0];
                $codigo = (string)$prod->cProd;
                $descricao = (string)$prod->xProd;
                $quantidade = (float)$prod->qCom;
                $valor_unitario = (float)$prod->vUnCom;
                $valor_total_item = (float)$prod->vItem;

                // Inserir item
                $stmt = $this->pdo->prepare("
                    INSERT INTO est_nfe_itens (
                        nfe_id, codigo_produto, descricao, 
                        quantidade, valor_unitario, valor_total
                    ) VALUES (?, ?, ?, ?, ?, ?)
                ");

                $stmt->execute([
                    $nfe_id,
                    $codigo,
                    $descricao,
                    $quantidade,
                    $valor_unitario,
                    $valor_total_item
                ]);

                // Atualizar estoque
                $this->atualizarEstoque($codigo, $descricao, $quantidade, $valor_unitario);
            }

            $this->pdo->commit();

            return [
                'success' => true,
                'message' => 'NF-e importada com sucesso',
                'chave_nfe' => $chave_nfe,
                'itens' => count($det)
            ];

        } catch (Exception $e) {
            $this->pdo->rollBack();
            throw $e;
        }
    }

    /**
     * Atualizar estoque com base na NF-e
     */
    private function atualizarEstoque($codigo, $descricao, $quantidade, $valor_unitario) {
        // Verificar se produto existe
        $stmt = $this->pdo->prepare("SELECT id FROM est_produtos WHERE codigo = ?");
        $stmt->execute([$codigo]);
        $produto = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($produto) {
            // Atualizar produto existente
            $stmt = $this->pdo->prepare("
                UPDATE est_produtos 
                SET estoque_atual = estoque_atual + ?,
                    custo_medio = ((custo_medio * estoque_atual) + (? * ?)) / (estoque_atual + ?)
                WHERE id = ?
            ");
            $stmt->execute([$quantidade, $valor_unitario, $quantidade, $quantidade, $produto['id']]);
        } else {
            // Criar novo produto
            $stmt = $this->pdo->prepare("
                INSERT INTO est_produtos (
                    codigo, nome, estoque_atual, custo_medio, 
                    categoria, ativo
                ) VALUES (?, ?, ?, ?, 'Importado SEFAZ', 1)
            ");
            $stmt->execute([$codigo, $descricao, $quantidade, $valor_unitario]);
        }

        // Registrar movimentação
        $stmt = $this->pdo->prepare("
            INSERT INTO est_movimentacoes (
                produto_id, tipo, quantidade, custo_unitario, 
                data, descricao
            ) VALUES (
                (SELECT id FROM est_produtos WHERE codigo = ?),
                'entrada',
                ?,
                ?,
                NOW(),
                'Importação SEFAZ'
            )
        ");
        $stmt->execute([$codigo, $quantidade, $valor_unitario]);
    }

    /**
     * Consultar status da NF-e na SEFAZ
     */
    public function consultarStatusNFe($chave_nfe) {
        try {
            $certs = $this->extractCertificate();
            
            // Preparar contexto SSL com certificado
            $context = stream_context_create([
                'ssl' => [
                    'local_cert' => $certs['cert'],
                    'local_pk' => $certs['pkey'],
                    'verify_peer' => false,
                    'verify_peer_name' => false
                ]
            ]);

            // Preparar SOAP request
            $soap_client = new SoapClient(
                $this->soap_url,
                [
                    'stream_context' => $context,
                    'local_cert' => $certs['cert'],
                    'local_pk' => $certs['pkey']
                ]
            );

            // Consultar protocolo
            $result = $soap_client->nfeConsultaProtocolo([
                'chNFe' => $chave_nfe
            ]);

            return $result;

        } catch (Exception $e) {
            throw new Exception('Erro ao consultar SEFAZ: ' . $e->getMessage());
        }
    }

    /**
     * Validar XML da NF-e
     */
    public function validarXML($xml_content) {
        $xml = simplexml_load_string($xml_content);
        
        if (!$xml) {
            return ['valid' => false, 'error' => 'XML inválido'];
        }

        // Verificar estrutura básica
        $required_fields = ['nfe:NFe', 'nfe:infNFe', 'nfe:ide', 'nfe:emit'];
        
        foreach ($required_fields as $field) {
            if (empty($xml->xpath('//' . $field))) {
                return ['valid' => false, 'error' => "Campo obrigatório ausente: $field"];
            }
        }

        return ['valid' => true];
    }
}

// Função para criar tabelas SEFAZ
function criarTabelasSEFAZ($pdo) {
    try {
        // Tabela de NF-e
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS est_nfe (
                id INT PRIMARY KEY AUTO_INCREMENT,
                chave_nfe VARCHAR(44) UNIQUE NOT NULL,
                numero VARCHAR(20) NOT NULL,
                serie VARCHAR(5) NOT NULL,
                data_emissao DATETIME NOT NULL,
                cnpj_emitente VARCHAR(14) NOT NULL,
                cnpj_destinatario VARCHAR(14),
                valor_total DECIMAL(12, 2) NOT NULL,
                xml_content LONGTEXT,
                status VARCHAR(20) DEFAULT 'importada',
                data_import DATETIME DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_chave (chave_nfe),
                INDEX idx_data (data_emissao)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        ");

        // Tabela de itens da NF-e
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS est_nfe_itens (
                id INT PRIMARY KEY AUTO_INCREMENT,
                nfe_id INT NOT NULL,
                codigo_produto VARCHAR(60) NOT NULL,
                descricao VARCHAR(255) NOT NULL,
                quantidade DECIMAL(12, 4) NOT NULL,
                valor_unitario DECIMAL(12, 2) NOT NULL,
                valor_total DECIMAL(12, 2) NOT NULL,
                FOREIGN KEY (nfe_id) REFERENCES est_nfe(id) ON DELETE CASCADE,
                INDEX idx_nfe (nfe_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        ");

        return true;
    } catch (Exception $e) {
        throw $e;
    }
}

?>
