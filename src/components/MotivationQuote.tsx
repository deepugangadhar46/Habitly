import { useState, useEffect } from 'react';
import { getRandomGeneralQuote, getTimeBasedGreeting } from '@/lib/quoteEngine';
import { Sparkles } from 'lucide-react';

export default function MotivationQuote() {
  const [quote, setQuote] = useState(getRandomGeneralQuote());
  const [greeting, setGreeting] = useState(getTimeBasedGreeting());

  useEffect(() => {
    const updateQuote = () => {
      setQuote(getRandomGeneralQuote());
      setGreeting(getTimeBasedGreeting());
    };

    // Update quote every 5 minutes
    const quoteInterval = setInterval(updateQuote, 5 * 60 * 1000);
    
    // Update greeting every hour
    const greetingInterval = setInterval(() => {
      setGreeting(getTimeBasedGreeting());
    }, 60 * 60 * 1000);

    return () => {
      clearInterval(quoteInterval);
      clearInterval(greetingInterval);
    };
  }, []);

  return (
    <div className="space-y-3 py-4 px-4 md:px-6">
      <div className="flex items-center justify-center gap-2 text-sm md:text-base font-medium text-foreground">
        <Sparkles className="w-4 h-4 md:w-5 md:h-5 text-primary" />
        <p>{greeting}</p>
      </div>
      <p className="text-center text-sm md:text-base italic text-muted-foreground transition-all duration-500">
        "{quote}"
      </p>
    </div>
  );
}
