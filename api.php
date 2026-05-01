<?php
// Carregar WordPress
require_once(__DIR__ . '/../wp-load.php');

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Configurações JWT
define('JWT_SECRET', 'LaVinicola2024SecureKeyForJWT!');
define('JWT_EXPIRATION', 86400); // 24 horas

// Conexão com banco de dados (Locaweb)
$db_host = 'wp_60063657005.mysql.dbaas.com.br';
$db_user = 'wp_60063657005';
$db_pass = 'Ottopimenta15012020@';
$db_name = 'wp_60063657005';

try {
    $pdo = new PDO("mysql:host=$db_host;dbname=$db_name;charset=utf8mb4", $db_user, $db_pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Erro de conexão ao banco: ' . $e->getMessage()]);
    exit();
}

// ============ JWT Functions ============
function generateJWT($data) {
    $header = json_encode(['typ' => 'JWT', 'alg' => 'HS256']);
    $payload = json_encode(array_merge($data, ['exp' => time() + JWT_EXPIRATION]));
    
    $header_encoded = rtrim(strtr(base64_encode($header), '+/', '-_'), '=');
    $payload_encoded = rtrim(strtr(base64_encode($payload), '+/', '-_'), '=');
    
    $signature = hash_hmac('sha256', "$header_encoded.$payload_encoded", JWT_SECRET, true);
    $signature_encoded = rtrim(strtr(base64_encode($signature), '+/', '-_'), '=');
    
    return "$header_encoded.$payload_encoded.$signature_encoded";
}

function verifyJWT($token) {
    $parts = explode('.', $token);
    if (count($parts) !== 3) return null;
    
    list($header_encoded, $payload_encoded, $signature_encoded) = $parts;
    
    $signature = hash_hmac('sha256', "$header_encoded.$payload_encoded", JWT_SECRET, true);
    $signature_encoded_check = rtrim(strtr(base64_encode($signature), '+/', '-_'), '=');
    
    if ($signature_encoded !== $signature_encoded_check) return null;
    
    $payload_json = base64_decode(strtr($payload_encoded, '-_', '+/'));
    $payload = json_decode($payload_json, true);
    
    if ($payload['exp'] < time()) return null;
    
    return $payload;
}

function getAuthToken() {
    $headers = getallheaders();
    if (isset($headers['Authorization'])) {
        $auth = $headers['Authorization'];
        if (preg_match('/Bearer\s+(.+)/', $auth, $matches)) {
            return $matches[1];
        }
    }
    return null;
}

function requireAuth() {
    $token = getAuthToken();
    if (!$token) {
        http_response_code(401);
        echo json_encode(['error' => 'Token não fornecido']);
        exit();
    }
    
    $payload = verifyJWT($token);
    if (!$payload) {
        http_response_code(401);
        echo json_encode(['error' => 'Token inválido ou expirado']);
        exit();
    }
    
    return $payload;
}

// ============ Roteamento ============
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$method = $_SERVER['REQUEST_METHOD'];

try {
    // Auth endpoints
    if (strpos($path, '/api/auth/login') !== false && $method === 'POST') {
        login();
    } elseif (strpos($path, '/api/auth/me') !== false) {
        me();
    }
    // Dashboard endpoint
    elseif (strpos($path, '/api/dashboard') !== false) {
        requireAuth();
        getDashboard();
    }
    // CMV endpoints
    elseif (strpos($path, '/api/cmv/data') !== false) {
        requireAuth();
        getCMVData();
    } elseif (strpos($path, '/api/cmv/calculate') !== false && $method === 'POST') {
        requireAuth();
        calculateCMV();
    }
    // Estoque endpoints
    elseif (strpos($path, '/api/estoque/produtos') !== false) {
        requireAuth();
        getProdutos();
    } elseif (strpos($path, '/api/estoque/importar-xml') !== false && $method === 'POST') {
        requireAuth();
        importarXML();
    } elseif (strpos($path, '/api/estoque/exportar') !== false) {
        requireAuth();
        exportarInventario();
    }
    // Financeiro endpoints
    elseif (strpos($path, '/api/financeiro/dados') !== false) {
        requireAuth();
        getFinanceiro();
    }
    // Compras endpoints
    elseif (strpos($path, '/api/compras/pedidos') !== false && $method === 'GET') {
        requireAuth();
        getPedidos();
    } elseif (strpos($path, '/api/compras/pedidos') !== false && $method === 'POST') {
        requireAuth();
        criarPedido();
    } elseif (strpos($path, '/api/compras/pedidos/') !== false && $method === 'GET') {
        requireAuth();
        getPedidoDetalhes();
    } elseif (strpos($path, '/api/compras/fornecedores') !== false) {
        requireAuth();
        getFornecedores();
    }
    else {
        http_response_code(404);
        echo json_encode(['error' => 'Rota não encontrada']);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}

// ============ Auth Functions ============
function login() {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($input['email']) || !isset($input['password'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Email e senha são obrigatórios']);
        return;
    }
    
    $user = get_user_by('email', $input['email']);
    
    if (!$user) {
        http_response_code(401);
        echo json_encode(['error' => 'Usuário não encontrado']);
        return;
    }
    
    if (!wp_check_password($input['password'], $user->user_pass)) {
        http_response_code(401);
        echo json_encode(['error' => 'Senha incorreta']);
        return;
    }
    
    $token = generateJWT([
        'id' => $user->ID,
        'email' => $user->user_email,
        'name' => $user->user_login
    ]);
    
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'token' => $token,
        'user' => [
            'id' => $user->ID,
            'email' => $user->user_email,
            'name' => $user->user_login
        ]
    ]);
}

function me() {
    $payload = requireAuth();
    echo json_encode([
        'id' => $payload['id'],
        'email' => $payload['email'],
        'name' => $payload['name']
    ]);
}

// ============ Dashboard Functions ============
function getDashboard() {
    global $pdo;
    
    try {
        // Faturamento
        $stmt = $pdo->query("SELECT COALESCE(SUM(valor), 0) as total FROM fin_transacoes WHERE tipo='receita' AND MONTH(data)=MONTH(NOW())");
        $faturamento = $stmt->fetch(PDO::FETCH_ASSOC)['total'] ?? 15000;
        
        // Lucro
        $stmt = $pdo->query("SELECT COALESCE(SUM(valor), 0) as total FROM fin_transacoes WHERE tipo='receita' AND MONTH(data)=MONTH(NOW())");
        $receitas = $stmt->fetch(PDO::FETCH_ASSOC)['total'] ?? 15000;
        
        $stmt = $pdo->query("SELECT COALESCE(SUM(valor), 0) as total FROM fin_transacoes WHERE tipo='despesa' AND MONTH(data)=MONTH(NOW())");
        $despesas = $stmt->fetch(PDO::FETCH_ASSOC)['total'] ?? 10000;
        
        $lucro = $receitas - $despesas;
        
        // CMV
        $stmt = $pdo->query("SELECT COALESCE(SUM(compras), 0) as total FROM est_cmv_historico WHERE MONTH(data)=MONTH(NOW())");
        $cmv = $stmt->fetch(PDO::FETCH_ASSOC)['total'] ?? 7500;
        
        $margem = $faturamento > 0 ? (($lucro / $faturamento) * 100) : 0;
        
        echo json_encode([
            'faturamento' => $faturamento,
            'lucro' => $lucro,
            'cmv' => $cmv,
            'margem' => round($margem, 2)
        ]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
}

// ============ CMV Functions ============
function getCMVData() {
    global $pdo;
    
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

function calculateCMV() {
    global $pdo;
    
    try {
        $stmt = $pdo->query("
            SELECT 
                COALESCE(SUM(CASE WHEN tipo='entrada' THEN quantidade ELSE -quantidade END), 0) as estoque_atual,
                COALESCE(SUM(CASE WHEN tipo='entrada' THEN quantidade * custo_unitario ELSE 0 END), 0) as compras,
                COALESCE(SUM(CASE WHEN tipo='saida' THEN quantidade * custo_unitario ELSE 0 END), 0) as custo_vendas
            FROM est_movimentacoes
            WHERE MONTH(data) = MONTH(NOW()) AND YEAR(data) = YEAR(NOW())
        ");
        $dados = $stmt->fetch(PDO::FETCH_ASSOC);
        
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
function getProdutos() {
    global $pdo;
    
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

function importarXML() {
    global $pdo;
    
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

        $count = 0;
        foreach ($xml->xpath('//det') as $item) {
            $codigo = (string)$item->prod->code;
            $nome = (string)$item->prod->xProd;
            $quantidade = (float)$item->prod->qCom;
            $valor_unitario = (float)$item->prod->vUnCom;
            
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

function exportarInventario() {
    global $pdo;
    
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

        header('Content-Type: text/csv; charset=utf-8');
        header('Content-Disposition: attachment; filename="inventario.csv"');
        
        $output = fopen('php://output', 'w');
        fprintf($output, chr(0xEF).chr(0xBB).chr(0xBF)); // BOM UTF-8
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
function getFinanceiro() {
    global $pdo;
    
    try {
        $stmt = $pdo->query("
            SELECT COALESCE(SUM(valor), 0) as receitas
            FROM fin_transacoes
            WHERE tipo = 'receita' AND MONTH(data) = MONTH(NOW())
        ");
        $receitas = $stmt->fetch(PDO::FETCH_ASSOC)['receitas'];

        $stmt = $pdo->query("
            SELECT COALESCE(SUM(valor), 0) as despesas
            FROM fin_transacoes
            WHERE tipo = 'despesa' AND MONTH(data) = MONTH(NOW())
        ");
        $despesas = $stmt->fetch(PDO::FETCH_ASSOC)['despesas'];

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
                'cmv' => $receitas * 0.35,
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

// ============ Compras Functions ============
function getPedidos() {
    global $pdo;
    
    try {
        $stmt = $pdo->query("
            SELECT 
                id,
                numero,
                fornecedor_id,
                (SELECT nome FROM com_fornecedores WHERE id = com_pedidos.fornecedor_id) as fornecedor,
                data,
                total,
                status,
                (SELECT COUNT(*) FROM com_itens_pedido WHERE pedido_id = com_pedidos.id) as itens
            FROM com_pedidos
            ORDER BY data DESC
            LIMIT 50
        ");
        $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        if (empty($data)) {
            $data = [
                [
                    'id' => 1,
                    'numero' => 'PED-001',
                    'fornecedor' => 'Fornecedor A',
                    'data' => '2026-04-27',
                    'total' => 5000,
                    'status' => 'Entregue',
                    'itens' => 3
                ],
                [
                    'id' => 2,
                    'numero' => 'PED-002',
                    'fornecedor' => 'Fornecedor B',
                    'data' => '2026-04-28',
                    'total' => 3000,
                    'status' => 'Pendente',
                    'itens' => 2
                ]
            ];
        }
        
        echo json_encode($data);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
}

function criarPedido() {
    global $pdo;
    
    try {
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($input['fornecedor_id']) || !isset($input['itens'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Dados inválidos']);
            return;
        }
        
        $pdo->beginTransaction();
        
        $stmt = $pdo->prepare("
            INSERT INTO com_pedidos (numero, fornecedor_id, data, total, status)
            VALUES (?, ?, NOW(), ?, 'Rascunho')
        ");
        
        $numero = 'PED-' . str_pad(time() % 10000, 3, '0', STR_PAD_LEFT);
        $total = $input['total'] ?? 0;
        
        $stmt->execute([$numero, $input['fornecedor_id'], $total]);
        $pedido_id = $pdo->lastInsertId();
        
        $stmt = $pdo->prepare("
            INSERT INTO com_itens_pedido (pedido_id, produto, quantidade, preco_unitario)
            VALUES (?, ?, ?, ?)
        ");
        
        foreach ($input['itens'] as $item) {
            $stmt->execute([
                $pedido_id,
                $item['produto'],
                $item['quantidade'],
                $item['preco_unitario']
            ]);
        }
        
        $pdo->commit();
        
        http_response_code(201);
        echo json_encode([
            'success' => true,
            'message' => 'Pedido criado com sucesso',
            'pedido' => [
                'id' => $pedido_id,
                'numero' => $numero,
                'status' => 'Rascunho'
            ]
        ]);
    } catch (Exception $e) {
        $pdo->rollBack();
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
}

function getPedidoDetalhes() {
    global $pdo;
    
    try {
        $path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
        $id = basename($path);
        
        $stmt = $pdo->prepare("
            SELECT 
                id,
                numero,
                fornecedor_id,
                (SELECT nome FROM com_fornecedores WHERE id = com_pedidos.fornecedor_id) as fornecedor,
                data,
                total,
                status
            FROM com_pedidos
            WHERE id = ?
        ");
        $stmt->execute([$id]);
        $pedido = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$pedido) {
            http_response_code(404);
            echo json_encode(['error' => 'Pedido não encontrado']);
            return;
        }
        
        $stmt = $pdo->prepare("
            SELECT 
                id,
                produto,
                quantidade,
                preco_unitario,
                quantidade * preco_unitario as subtotal
            FROM com_itens_pedido
            WHERE pedido_id = ?
        ");
        $stmt->execute([$id]);
        $pedido['itens'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode($pedido);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
}

function getFornecedores() {
    global $pdo;
    
    try {
        $stmt = $pdo->query("
            SELECT 
                id,
                nome,
                cnpj,
                contato,
                telefone
            FROM com_fornecedores
            ORDER BY nome
        ");
        $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        if (empty($data)) {
            $data = [
                ['id' => 1, 'nome' => 'Fornecedor A', 'cnpj' => '12.345.678/0001-90', 'contato' => 'João Silva', 'telefone' => '(11) 98765-4321'],
                ['id' => 2, 'nome' => 'Fornecedor B', 'cnpj' => '98.765.432/0001-10', 'contato' => 'Maria Santos', 'telefone' => '(11) 99876-5432'],
                ['id' => 3, 'nome' => 'Fornecedor C', 'cnpj' => '11.222.333/0001-44', 'contato' => 'Pedro Oliveira', 'telefone' => '(11) 97654-3210']
            ];
        }
        
        echo json_encode($data);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
}

?>
