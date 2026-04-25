import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Coffee, Copy, Check } from 'lucide-react';

interface CoffeePopupProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CoffeePopup({ isOpen, onClose }: CoffeePopupProps) {
  const [copied, setCopied] = useState(false);

  const mpesaNumber = '+254702188406';

  const handleCopy = () => {
    navigator.clipboard.writeText(mpesaNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleBuyNow = () => {
    // In a real app, this would redirect to M-Pesa or payment gateway
    handleCopy();
    // Optionally open a modal or redirect
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Coffee className="w-5 h-5 text-amber-600" />
            <DialogTitle>Buy Me a Coffee ☕</DialogTitle>
          </div>
          <DialogDescription>
            If you found this tool helpful, consider supporting the development!
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="rounded-lg bg-amber-50 p-4 border border-amber-200">
            <p className="text-sm font-medium text-amber-900 mb-3">M-Pesa Number:</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-white px-3 py-2 rounded border border-amber-300 text-sm font-mono text-foreground">
                {mpesaNumber}
              </code>
              <Button
                size="sm"
                variant="outline"
                onClick={handleCopy}
                className="border-amber-300 hover:bg-amber-100"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-green-600" />
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                  </>
                )}
              </Button>
            </div>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            Send any amount via M-Pesa to support this project 💝
          </p>
        </div>

        <div className="flex gap-3">
          <Button
            onClick={handleBuyNow}
            className="flex-1 bg-amber-600 hover:bg-amber-700 text-white"
          >
            <Coffee className="w-4 h-4 mr-2" />
            Buy Me Coffee
          </Button>
          <Button
            onClick={onClose}
            variant="outline"
            className="flex-1"
          >
            Buy Later
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
