import json
import os
import random
from decimal import Decimal
from datetime import datetime
import psycopg2
from psycopg2.extras import RealDictCursor

def get_db_connection():
    return psycopg2.connect(os.environ['DATABASE_URL'])

def handler(event, context):
    '''
    Casino API: handle balance, transactions, and games
    Args: event - dict with httpMethod, body, queryStringParameters
          context - object with request_id, function_name
    Returns: HTTP response dict
    '''
    method = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    params = event.get('queryStringParameters') or {}
    action = params.get('action', 'balance')
    user_id = 1
    
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    try:
        if method == 'GET' and action == 'balance':
            cur.execute("SELECT balance FROM users WHERE id = %s", (user_id,))
            result = cur.fetchone()
            balance = float(result['balance']) if result else 0
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'balance': balance}),
                'isBase64Encoded': False
            }
        
        if method == 'POST' and action == 'transfer':
            body = json.loads(event.get('body', '{}'))
            amount = Decimal(str(body.get('amount', 0)))
            transfer_type = body.get('type', 'deposit')
            recipient = body.get('recipient', '')
            
            if amount <= 0:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Сумма должна быть больше 0'}),
                    'isBase64Encoded': False
                }
            
            cur.execute("SELECT balance FROM users WHERE id = %s FOR UPDATE", (user_id,))
            user = cur.fetchone()
            current_balance = user['balance']
            
            if transfer_type == 'withdraw' and current_balance < amount:
                conn.rollback()
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Недостаточно средств'}),
                    'isBase64Encoded': False
                }
            
            new_balance = current_balance + amount if transfer_type == 'deposit' else current_balance - amount
            
            cur.execute("UPDATE users SET balance = %s WHERE id = %s", (new_balance, user_id))
            
            description = f"Пополнение на {amount}₽" if transfer_type == 'deposit' else f"Вывод {amount}₽ на {recipient}"
            cur.execute(
                "INSERT INTO transactions (user_id, type, amount, description) VALUES (%s, %s, %s, %s)",
                (user_id, transfer_type, amount, description)
            )
            
            conn.commit()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'balance': float(new_balance), 'message': 'Транзакция выполнена'}),
                'isBase64Encoded': False
            }
        
        if method == 'POST' and action == 'play':
            body = json.loads(event.get('body', '{}'))
            game_name = body.get('game', 'slots')
            bet = Decimal(str(body.get('bet', 0)))
            
            if bet <= 0:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Ставка должна быть больше 0'}),
                    'isBase64Encoded': False
                }
            
            cur.execute("SELECT balance FROM users WHERE id = %s FOR UPDATE", (user_id,))
            user = cur.fetchone()
            current_balance = user['balance']
            
            if current_balance < bet:
                conn.rollback()
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Недостаточно средств'}),
                    'isBase64Encoded': False
                }
            
            win = Decimal('0')
            result_data = {}
            
            if game_name == 'slots':
                symbols = ['🍒', '🍋', '🍊', '💎', '7️⃣', '⭐']
                reels = [random.choice(symbols) for _ in range(3)]
                result_data = {'reels': reels}
                
                if reels[0] == reels[1] == reels[2]:
                    if reels[0] == '💎':
                        win = bet * 10
                    elif reels[0] == '7️⃣':
                        win = bet * 7
                    else:
                        win = bet * 5
                elif reels[0] == reels[1] or reels[1] == reels[2]:
                    win = bet * 2
            
            elif game_name == 'roulette':
                choice = body.get('choice', 'red')
                number = random.randint(0, 36)
                color = 'green' if number == 0 else ('red' if number % 2 == 1 else 'black')
                
                result_data = {'number': number, 'color': color}
                
                if choice == color:
                    win = bet * 2 if color != 'green' else bet * 35
            
            new_balance = current_balance - bet + win
            
            cur.execute("UPDATE users SET balance = %s WHERE id = %s", (new_balance, user_id))
            cur.execute(
                "INSERT INTO game_history (user_id, game_name, bet_amount, win_amount, result) VALUES (%s, %s, %s, %s, %s)",
                (user_id, game_name, bet, win, json.dumps(result_data))
            )
            
            conn.commit()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'win': float(win),
                    'balance': float(new_balance),
                    'result': result_data
                }),
                'isBase64Encoded': False
            }
        
        if method == 'GET' and action == 'history':
            cur.execute(
                "SELECT * FROM transactions WHERE user_id = %s ORDER BY created_at DESC LIMIT 10",
                (user_id,)
            )
            transactions = cur.fetchall()
            
            for t in transactions:
                t['amount'] = float(t['amount'])
                t['created_at'] = t['created_at'].isoformat()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'transactions': transactions}),
                'isBase64Encoded': False
            }
        
        return {
            'statusCode': 404,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Endpoint not found'}),
            'isBase64Encoded': False
        }
    
    except Exception as e:
        conn.rollback()
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }
    finally:
        cur.close()
        conn.close()