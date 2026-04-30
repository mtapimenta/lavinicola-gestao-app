<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Conexão com banco de dados
$host = 'wp_60063657005.mysql.dbaas.com.br';
$user = 'wp_60063657005';
$pass = 'Ottopimenta15012020@';
$db = 'wp_60063657005';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$db;charset=utf8mb4", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Erro de conexão: ' . $e->getMessage()]);
    exit();
}

// Roteamento
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$method = $_SERVER['REQUEST_METHOD'];

// CMV endpoints
if (strpos($path, '/api/cmv/data') !== false) {
    getCMVData($pdo);
} elseif (strpos($path, '/api/cmv/calculate') !== false && $method === 'POST') {
    calculateCMV($pdo);
}
// Estoque endpoints
elseif (strpos($path, '/api/estoque/produtos') !== false) {
    getProdutos($pdo);
} elseif (strpos($path, '/api/estoque/importar-xml') !== false && $method === 'POST') {
    importarXML($pdo);
} elseif (strpos($path, '/api/estoque/exportar') !== false) {
    exportarInventario($pdo);
}
// Financeiro endpoints
elseif (strpos($path, '/api/financeiro/dados') !== false) {
    getFinanceiro($pdo);
} else {
    http_response_code(404);
    echo json_encode(['error' => 'Rota não encontrada']);
}

// ============ CMV Functions ============
function getCMVData($pdo) {
    try {
        $stmt = $pdo->query("
            SELECT 
                DATE_FORMAT(data, '%b/%Y') as mes,
                estoque_inicial as ei,
                compras,
                estoque_final as ef,
                (estoque_inicial + compras - estoque_final) as custoTotal,
                faturamento,
                ROUND(((estoque_inicial + compras - estoque_final) / NULLIF(faturamento, 0)) * 100, 2) as percentual
            FROM est_cmv_historico
            ORDER BY data DESC
            LIMIT 12
        ");
        $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode(array_reverse($data));
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
}

function calculateCMV($pdo) {
    try {
        // Buscar dados do mês atual
        $stmt = $pdo->query("
            SELECT 
                COALESCE(SUM(CASE WHEN tipo='entrada' THEN quantidade ELSE -quantidade END), 0) as estoque_atual,
                COALESCE(SUM(CASE WHEN tipo='entrada' THEN quantidade * custo_unitario ELSE 0 END), 0) as compras,
                COALESCE(SUM(CASE WHEN tipo='saida' THEN quantidade * custo_unitario ELSE 0 END), 0) as custo_vendas
            FROM est_movimentacoes
            WHERE MONTH(data) = MONTH(NOW()) AND YEAR(data) = YEAR(NOW())
        ");
        $dados = $stmt->fetch(PDO::FETCH_ASSOC);
        
        // Inserir cálculo no histórico
        $stmt = $pdo->prepare("
            INSERT INTO est_cmv_historico 
            (data, estoque_inicial, compras, estoque_final, faturamento)
            VALUES (NOW(), 0, ?, 0, 0)
            ON DUPLICATE KEY UPDATE compras = ?
        ");
        $stmt->execute([$dados['compras'], $dados['compras']]);
        
        http_response_code(200);
        echo json_encode(['success' => true, 'message' => 'CMV calculado']);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
}

// ============ Estoque Functions ============
function getProdutos($pdo) {
    try {
        $stmt = $pdo->query("
            SELECT 
                id,
                codigo,
                nome,
                descricao,
                categoria,
                estoque_atual,
                estoque_minimo,
                custo_medio,
                preco_venda,
                ativo
            FROM est_produtos
            WHERE ativo = 1
            ORDER BY nome
        ");
        $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode($data);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
}

function importarXML($pdo) {
    try {
        if (!isset($_FILES['xml'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Arquivo XML não enviado']);
            return;
        }

        $xmlFile = $_FILES['xml']['tmp_name'];
        $xml = simplexml_load_file($xmlFile);
        
        if (!$xml) {
            http_response_code(400);
            echo json_encode(['error' => 'XML inválido']);
            return;
        }

        // Processar itens do XML (NF-e)
        $count = 0;
        foreach ($xml->xpath('//det') as $item) {
            $codigo = (string)$item->prod->code;
            $nome = (string)$item->prod->xProd;
            $quantidade = (float)$item->prod->qCom;
            $valor_unitario = (float)$item->prod->vUnCom;
            
            // Atualizar estoque
            $stmt = $pdo->prepare("
                INSERT INTO est_produtos (codigo, nome, estoque_atual, custo_medio, categoria, ativo)
                VALUES (?, ?, ?, ?, 'Importado', 1)
                ON DUPLICATE KEY UPDATE 
                    estoque_atual = estoque_atual + ?,
                    custo_medio = ((custo_medio * estoque_atual) + (? * ?)) / (estoque_atual + ?)
            ");
            $stmt->execute([$codigo, $nome, $quantidade, $valor_unitario, $quantidade, $valor_unitario, $quantidade, $quantidade]);
            $count++;
        }

        http_response_code(200);
        echo json_encode(['success' => true, 'message' => "$count itens importados"]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
}

function exportarInventario($pdo) {
    try {
        $stmt = $pdo->query("
            SELECT 
                codigo,
                nome,
                categoria,
                estoque_atual,
                custo_medio,
                estoque_atual * custo_medio as valor_total,
                estoque_minimo,
                preco_venda
            FROM est_produtos
            WHERE ativo = 1
            ORDER BY categoria, nome
        ");
        $data = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Gerar CSV
        header('Content-Type: text/csv');
        header('Content-Disposition: attachment; filename="inventario.csv"');
        
        $output = fopen('php://output', 'w');
        fputcsv($output, ['Código', 'Produto', 'Categoria', 'Quantidade', 'Custo Unitário', 'Valor Total', 'Mínimo', 'Preço Venda']);
        
        foreach ($data as $row) {
            fputcsv($output, $row);
        }
        fclose($output);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
}

// ============ Financeiro Functions ============
function getFinanceiro($pdo) {
    try {
        // DRE
        $stmt = $pdo->query("
            SELECT 
                COALESCE(SUM(valor), 0) as receitas
            FROM fin_transacoes
            WHERE tipo = 'receita' AND MONTH(data) = MONTH(NOW())
        ");
        $receitas = $stmt->fetch(PDO::FETCH_ASSOC)['receitas'];

        $stmt = $pdo->query("
            SELECT 
                COALESCE(SUM(valor), 0) as despesas
            FROM fin_transacoes
            WHERE tipo = 'despesa' AND MONTH(data) = MONTH(NOW())
        ");
        $despesas = $stmt->fetch(PDO::FETCH_ASSOC)['despesas'];

        // Contas
        $stmt = $pdo->query("
            SELECT * FROM fin_contas_pagar
            WHERE data_vencimento >= CURDATE()
            ORDER BY data_vencimento
        ");
        $contas_pagar = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $stmt = $pdo->query("
            SELECT * FROM fin_contas_receber
            WHERE data_vencimento >= CURDATE()
            ORDER BY data_vencimento
        ");
        $contas_receber = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $data = [
            'dre' => [
                'receitas' => $receitas,
                'despesas' => $despesas,
                'cmv' => $receitas * 0.35, // Estimado
                'despesasOp' => $despesas * 0.6,
                'resultado' => $receitas - $despesas,
                'historico' => []
            ],
            'fluxoCaixa' => [
                'saldoInicial' => 0,
                'entradasProjetadas' => $receitas,
                'saidasProjetadas' => $despesas,
                'saldoFinal' => $receitas - $despesas,
                'projecao' => []
            ],
            'contas' => [
                'pagar' => $contas_pagar,
                'receber' => $contas_receber
            ]
        ];

        echo json_encode($data);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
}

?>
