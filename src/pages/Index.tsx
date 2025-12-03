import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

const API_URL = 'https://functions.poehali.dev/fca85f6b-4530-4f3d-8164-e53f6939e689';

export default function Index() {
  const [balance, setBalance] = useState(0);
  const [showProfile, setShowProfile] = useState(false);
  const [activeTab, setActiveTab] = useState('games');
  const [loading, setLoading] = useState(false);
  const [showDeposit, setShowDeposit] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawRecipient, setWithdrawRecipient] = useState('');
  const [gameResult, setGameResult] = useState<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const fetchBalance = async () => {
    try {
      const res = await fetch(`${API_URL}?action=balance`);
      const data = await res.json();
      setBalance(data.balance);
    } catch (error) {
      console.error('Error fetching balance:', error);
    }
  };

  useEffect(() => {
    fetchBalance();
  }, []);

  const handleDeposit = async () => {
    if (!depositAmount || parseFloat(depositAmount) <= 0) {
      toast.error('Введите корректную сумму');
      return;
    }
    
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}?action=transfer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'deposit', amount: parseFloat(depositAmount) })
      });
      const data = await res.json();
      
      if (res.ok) {
        setBalance(data.balance);
        setDepositAmount('');
        setShowDeposit(false);
        toast.success(`Баланс пополнен на ${depositAmount}₽`);
      } else {
        toast.error(data.error || 'Ошибка пополнения');
      }
    } catch (error) {
      toast.error('Ошибка соединения');
    }
    setLoading(false);
  };

  const handleWithdraw = async () => {
    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
      toast.error('Введите корректную сумму');
      return;
    }
    if (!withdrawRecipient) {
      toast.error('Введите получателя');
      return;
    }
    
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}?action=transfer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          type: 'withdraw', 
          amount: parseFloat(withdrawAmount),
          recipient: withdrawRecipient
        })
      });
      const data = await res.json();
      
      if (res.ok) {
        setBalance(data.balance);
        setWithdrawAmount('');
        setWithdrawRecipient('');
        setShowWithdraw(false);
        toast.success('Вывод выполнен успешно');
      } else {
        toast.error(data.error || 'Ошибка вывода');
      }
    } catch (error) {
      toast.error('Ошибка соединения');
    }
    setLoading(false);
  };

  const playSlots = async (bet: number) => {
    if (balance < bet) {
      toast.error('Недостаточно средств');
      return;
    }
    
    setIsPlaying(true);
    setGameResult(null);
    
    try {
      const res = await fetch(`${API_URL}?action=play`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ game: 'slots', bet })
      });
      const data = await res.json();
      
      if (res.ok) {
        setBalance(data.balance);
        setGameResult(data);
        
        if (data.win > 0) {
          toast.success(`Выигрыш: ${data.win}₽! 🎉`);
        } else {
          toast.info('Попробуйте еще раз!');
        }
      } else {
        toast.error(data.error || 'Ошибка игры');
      }
    } catch (error) {
      toast.error('Ошибка соединения');
    }
    
    setTimeout(() => setIsPlaying(false), 1000);
  };

  const playRoulette = async (choice: string, bet: number) => {
    if (balance < bet) {
      toast.error('Недостаточно средств');
      return;
    }
    
    setIsPlaying(true);
    setGameResult(null);
    
    try {
      const res = await fetch(`${API_URL}?action=play`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ game: 'roulette', bet, choice })
      });
      const data = await res.json();
      
      if (res.ok) {
        setBalance(data.balance);
        setGameResult(data);
        
        if (data.win > 0) {
          toast.success(`Выигрыш: ${data.win}₽! Выпало ${data.result.number} (${data.result.color === 'red' ? 'красное' : data.result.color === 'black' ? 'чёрное' : 'зеро'}) 🎉`);
        } else {
          toast.info(`Выпало ${data.result.number} (${data.result.color === 'red' ? 'красное' : data.result.color === 'black' ? 'чёрное' : 'зеро'}). Попробуйте еще!`);
        }
      } else {
        toast.error(data.error || 'Ошибка игры');
      }
    } catch (error) {
      toast.error('Ошибка соединения');
    }
    
    setTimeout(() => setIsPlaying(false), 1000);
  };

  const games = [
    { id: 1, name: 'Lucky Slots', icon: 'Cherry', minBet: 10, maxWin: 5000, hot: true },
    { id: 2, name: 'Diamond Rush', icon: 'Gem', minBet: 50, maxWin: 10000, hot: true },
    { id: 3, name: 'Golden Wheel', icon: 'Circle', minBet: 100, maxWin: 25000, hot: false },
    { id: 4, name: 'Royal Poker', icon: 'Spade', minBet: 25, maxWin: 15000, hot: false },
    { id: 5, name: 'Crystal Dice', icon: 'Dice6', minBet: 20, maxWin: 8000, hot: true },
    { id: 6, name: 'Fortune Cards', icon: 'CreditCard', minBet: 15, maxWin: 6000, hot: false },
  ];

  const bonuses = [
    { title: 'Приветственный бонус', amount: '+100%', desc: 'До 50 000₽ на первый депозит', icon: 'Gift' },
    { title: 'Кэшбэк', amount: '10%', desc: 'Еженедельный возврат потерь', icon: 'Percent' },
    { title: 'Фриспины', amount: '50', desc: 'Бесплатных вращений каждый день', icon: 'RotateCw' },
    { title: 'VIP Программа', amount: 'VIP', desc: 'Эксклюзивные привилегии', icon: 'Crown' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0A0A0F] via-[#0F0F1A] to-[#0A0A0F]">
      <header className="border-b border-primary/20 backdrop-blur-md sticky top-0 z-50 bg-background/50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="gold-gradient w-10 h-10 rounded-full flex items-center justify-center gold-shimmer">
                <Icon name="Crown" size={24} className="text-background" />
              </div>
              <h1 className="text-2xl font-bold gold-gradient bg-clip-text text-transparent">
                ROYAL CASINO
              </h1>
            </div>

            <nav className="hidden md:flex gap-6">
              {['Игры', 'Рулетка', 'Бонусы', 'Рефералы'].map((item) => (
                <Button
                  key={item}
                  variant="ghost"
                  className="text-foreground hover:text-primary transition-all hover:scale-105"
                >
                  {item}
                </Button>
              ))}
            </nav>

            <div className="flex items-center gap-4">
              <div className="bg-card border border-primary/30 px-4 py-2 rounded-lg glow-gold">
                <div className="flex items-center gap-2">
                  <Icon name="Wallet" size={20} className="text-primary" />
                  <span className="font-bold text-primary">{balance.toLocaleString()}₽</span>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowProfile(!showProfile)}
                className="hover:bg-primary/10"
              >
                <Icon name="User" size={24} />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <section className="mb-12 relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary/20 via-secondary/20 to-primary/20 p-8 border border-primary/30 gold-shimmer">
          <div className="relative z-10">
            <Badge className="mb-4 bg-primary text-background animate-pulse-glow">
              🔥 Горячее предложение
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
              Приветственный бонус
              <span className="block text-primary gold-shimmer">+100% до 50 000₽</span>
            </h2>
            <p className="text-muted-foreground mb-6 max-w-xl">
              Удвойте свой первый депозит и получите эксклюзивные фриспины на популярные слоты
            </p>
            <Button className="gold-gradient text-background font-bold px-8 py-6 text-lg hover:scale-105 transition-transform">
              Получить бонус
            </Button>
          </div>
          <div className="absolute right-0 top-0 opacity-10">
            <Icon name="Sparkles" size={200} />
          </div>
        </section>

        <div className="mb-12">
          <div className="grid w-full grid-cols-4 bg-card border border-primary/20 p-1 rounded-lg mb-8">
            <button
              onClick={() => setActiveTab('games')}
              className={`flex items-center justify-center gap-2 py-3 px-4 rounded transition-all ${
                activeTab === 'games' ? 'bg-primary text-background' : 'hover:bg-muted'
              }`}
            >
              <Icon name="Gamepad2" size={18} />
              <span className="hidden sm:inline">Игры</span>
            </button>
            <button
              onClick={() => setActiveTab('roulette')}
              className={`flex items-center justify-center gap-2 py-3 px-4 rounded transition-all ${
                activeTab === 'roulette' ? 'bg-primary text-background' : 'hover:bg-muted'
              }`}
            >
              <Icon name="CircleDot" size={18} />
              <span className="hidden sm:inline">Рулетка</span>
            </button>
            <button
              onClick={() => setActiveTab('bonuses')}
              className={`flex items-center justify-center gap-2 py-3 px-4 rounded transition-all ${
                activeTab === 'bonuses' ? 'bg-primary text-background' : 'hover:bg-muted'
              }`}
            >
              <Icon name="Gift" size={18} />
              <span className="hidden sm:inline">Бонусы</span>
            </button>
            <button
              onClick={() => setActiveTab('referral')}
              className={`flex items-center justify-center gap-2 py-3 px-4 rounded transition-all ${
                activeTab === 'referral' ? 'bg-primary text-background' : 'hover:bg-muted'
              }`}
            >
              <Icon name="Users" size={18} />
              <span className="hidden sm:inline">Рефералы</span>
            </button>
          </div>

          {activeTab === 'games' && (
            <>
              {gameResult && gameResult.result && gameResult.result.reels && (
                <div className="mb-6 p-6 bg-card border border-primary/30 rounded-lg text-center animate-fade-in">
                  <div className="text-xl font-bold mb-4 text-foreground">Результат игры:</div>
                  <div className="flex justify-center gap-4 text-6xl mb-4">
                    {gameResult.result.reels.map((reel: string, i: number) => (
                      <div key={i} className="bg-muted p-4 rounded-lg animate-pulse-glow">
                        {reel}
                      </div>
                    ))}
                  </div>
                  <div className="text-2xl font-bold text-primary">
                    {gameResult.win > 0 ? `Выигрыш: ${gameResult.win}₽ 🎉` : 'Попробуйте еще раз!'}
                  </div>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
              {games.map((game) => (
                <Card
                  key={game.id}
                  className="group relative overflow-hidden bg-card border-primary/20 hover:border-primary/60 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-primary/20 cursor-pointer"
                >
                  {game.hot && (
                    <Badge className="absolute top-4 right-4 z-10 bg-destructive animate-pulse">
                      🔥 HOT
                    </Badge>
                  )}
                  <div className="p-6">
                    <div className="gold-gradient w-20 h-20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <Icon name={game.icon} size={40} className="text-background" />
                    </div>
                    <h3 className="text-xl font-bold mb-2 text-foreground">{game.name}</h3>
                    <div className="space-y-1 text-sm text-muted-foreground mb-4">
                      <p>Мин. ставка: <span className="text-primary font-semibold">{game.minBet}₽</span></p>
                      <p>Макс. выигрыш: <span className="text-primary font-semibold">{game.maxWin.toLocaleString()}₽</span></p>
                    </div>
                    <Button 
                      onClick={() => playSlots(game.minBet)}
                      disabled={isPlaying || loading}
                      className="w-full gold-gradient text-background font-semibold hover:opacity-90 disabled:opacity-50"
                    >
                      {isPlaying ? 'Играем...' : `Играть (${game.minBet}₽)`}
                    </Button>
                  </div>
                </Card>
              ))}
              </div>
            </>
          )}

          {activeTab === 'roulette' && (
            <Card className="bg-card border-primary/20 p-8 animate-fade-in">
              <div className="text-center mb-8">
                <div className="inline-flex gold-gradient w-32 h-32 rounded-full items-center justify-center mb-6 animate-pulse-glow">
                  <Icon name="CircleDot" size={64} className="text-background animate-spin" style={{ animationDuration: '3s' }} />
                </div>
                <h3 className="text-3xl font-bold mb-4 text-foreground">Классическая рулетка</h3>
                <p className="text-muted-foreground max-w-2xl mx-auto mb-6">
                  Испытайте удачу на колесе фортуны. Красное или чёрное? Чётное или нечётное? Сделайте вашу ставку!
                </p>
              </div>
              <div className="grid grid-cols-3 gap-4 max-w-md mx-auto mb-6">
                <Button 
                  onClick={() => playRoulette('red', 100)}
                  disabled={isPlaying || loading}
                  variant="outline" 
                  className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white disabled:opacity-50"
                >
                  Красное (x2)
                </Button>
                <Button 
                  onClick={() => playRoulette('green', 100)}
                  disabled={isPlaying || loading}
                  variant="outline" 
                  className="border-primary hover:bg-primary hover:text-background disabled:opacity-50"
                >
                  Зеро (x35)
                </Button>
                <Button 
                  onClick={() => playRoulette('black', 100)}
                  disabled={isPlaying || loading}
                  variant="outline" 
                  className="border-zinc-500 text-zinc-300 hover:bg-zinc-500 hover:text-white disabled:opacity-50"
                >
                  Чёрное (x2)
                </Button>
              </div>
              {gameResult && gameResult.result && gameResult.result.number !== undefined && (
                <div className="text-center mb-6 animate-fade-in">
                  <div className="text-2xl font-bold text-primary">
                    Выпало: {gameResult.result.number} ({gameResult.result.color === 'red' ? '🔴 Красное' : gameResult.result.color === 'black' ? '⚫ Чёрное' : '🟢 Зеро'})
                  </div>
                </div>
              )}
              <div className="text-center text-muted-foreground mb-4">Ставка: 100₽</div>
            </Card>
          )}

          {activeTab === 'bonuses' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
              {bonuses.map((bonus, index) => (
                <Card
                  key={index}
                  className="bg-card border-primary/20 p-6 hover:border-primary/60 transition-all duration-300 hover:scale-105 cursor-pointer group"
                >
                  <div className="flex items-start gap-4">
                    <div className="gold-gradient w-16 h-16 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                      <Icon name={bonus.icon} size={32} className="text-background" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold mb-2 text-foreground">{bonus.title}</h3>
                      <div className="text-3xl font-bold text-primary mb-2">{bonus.amount}</div>
                      <p className="text-muted-foreground text-sm mb-4">{bonus.desc}</p>
                      <Button variant="outline" className="border-primary text-primary hover:bg-primary hover:text-background">
                        Активировать
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {activeTab === 'referral' && (
            <Card className="bg-card border-primary/20 p-8 animate-fade-in">
              <div className="text-center mb-8">
                <div className="inline-flex gold-gradient w-24 h-24 rounded-full items-center justify-center mb-6">
                  <Icon name="Users" size={48} className="text-background" />
                </div>
                <h3 className="text-3xl font-bold mb-4 text-foreground">Реферальная программа</h3>
                <p className="text-muted-foreground max-w-2xl mx-auto mb-6">
                  Приглашайте друзей и получайте до 15% от их депозитов навсегда!
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <Card className="bg-muted p-6 text-center border-primary/20">
                  <div className="text-4xl font-bold text-primary mb-2">15%</div>
                  <p className="text-muted-foreground">Комиссия с депозитов</p>
                </Card>
                <Card className="bg-muted p-6 text-center border-primary/20">
                  <div className="text-4xl font-bold text-primary mb-2">0</div>
                  <p className="text-muted-foreground">Рефералов</p>
                </Card>
                <Card className="bg-muted p-6 text-center border-primary/20">
                  <div className="text-4xl font-bold text-primary mb-2">0₽</div>
                  <p className="text-muted-foreground">Заработано</p>
                </Card>
              </div>

              <div className="bg-muted rounded-lg p-4 mb-4">
                <div className="flex flex-col sm:flex-row items-center gap-2">
                  <code className="flex-1 text-sm text-foreground break-all">https://royal-casino.com/ref/USER12345</code>
                  <Button variant="outline" className="border-primary text-primary hover:bg-primary hover:text-background whitespace-nowrap">
                    <Icon name="Copy" size={18} className="mr-2" />
                    Копировать
                  </Button>
                </div>
              </div>

              <Button className="w-full gold-gradient text-background font-bold py-6 text-lg">
                <Icon name="Share2" size={20} className="mr-2" />
                Поделиться ссылкой
              </Button>
            </Card>
          )}
        </div>

        {showDeposit && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
            <Card className="bg-card border-primary/30 max-w-md w-full p-6 animate-scale-in">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-foreground">Пополнить баланс</h3>
                <Button variant="ghost" size="icon" onClick={() => setShowDeposit(false)}>
                  <Icon name="X" size={24} />
                </Button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">Сумма пополнения</label>
                  <Input
                    type="number"
                    placeholder="1000"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    className="text-lg"
                  />
                </div>
                
                <div className="grid grid-cols-3 gap-2">
                  {[1000, 5000, 10000].map(amount => (
                    <Button 
                      key={amount}
                      variant="outline"
                      onClick={() => setDepositAmount(amount.toString())}
                    >
                      +{amount}₽
                    </Button>
                  ))}
                </div>
                
                <Button 
                  onClick={handleDeposit}
                  disabled={loading}
                  className="w-full gold-gradient text-background font-bold py-6 text-lg"
                >
                  {loading ? 'Обработка...' : 'Пополнить'}
                </Button>
              </div>
            </Card>
          </div>
        )}

        {showWithdraw && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
            <Card className="bg-card border-primary/30 max-w-md w-full p-6 animate-scale-in">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-foreground">Вывести средства</h3>
                <Button variant="ghost" size="icon" onClick={() => setShowWithdraw(false)}>
                  <Icon name="X" size={24} />
                </Button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">Сумма вывода</label>
                  <Input
                    type="number"
                    placeholder="1000"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    className="text-lg"
                  />
                </div>
                
                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">Номер карты / кошелька</label>
                  <Input
                    type="text"
                    placeholder="1234 5678 9012 3456"
                    value={withdrawRecipient}
                    onChange={(e) => setWithdrawRecipient(e.target.value)}
                    className="text-lg"
                  />
                </div>
                
                <div className="bg-muted p-3 rounded-lg text-sm text-muted-foreground">
                  Доступно для вывода: <span className="text-primary font-bold">{balance.toLocaleString()}₽</span>
                </div>
                
                <Button 
                  onClick={handleWithdraw}
                  disabled={loading}
                  className="w-full gold-gradient text-background font-bold py-6 text-lg"
                >
                  {loading ? 'Обработка...' : 'Вывести'}
                </Button>
              </div>
            </Card>
          </div>
        )}

        {showProfile && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
            <Card className="bg-card border-primary/30 max-w-md w-full p-6 animate-scale-in">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-foreground">Личный кабинет</h3>
                <Button variant="ghost" size="icon" onClick={() => setShowProfile(false)}>
                  <Icon name="X" size={24} />
                </Button>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="gold-gradient w-16 h-16 rounded-full flex items-center justify-center">
                    <Icon name="User" size={32} className="text-background" />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg text-foreground">Player #12345</h4>
                    <Badge className="bg-primary text-background">VIP</Badge>
                  </div>
                </div>

                <div className="space-y-2">
                  <Button 
                    onClick={() => { setShowProfile(false); setShowDeposit(true); }}
                    className="w-full justify-start" 
                    variant="outline"
                  >
                    <Icon name="Wallet" size={20} className="mr-2" />
                    Пополнить баланс
                  </Button>
                  <Button 
                    onClick={() => { setShowProfile(false); setShowWithdraw(true); }}
                    className="w-full justify-start" 
                    variant="outline"
                  >
                    <Icon name="ArrowDownToLine" size={20} className="mr-2" />
                    Вывести средства
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <Icon name="History" size={20} className="mr-2" />
                    История транзакций
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <Icon name="Settings" size={20} className="mr-2" />
                    Настройки
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}
      </main>

      <footer className="border-t border-primary/20 mt-12 py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-muted-foreground">
            © 2024 Royal Casino. Играйте ответственно. 18+
          </p>
        </div>
      </footer>
    </div>
  );
}