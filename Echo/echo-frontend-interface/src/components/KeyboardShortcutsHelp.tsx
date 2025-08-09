import { Keyboard, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useKeyboardShortcutsHelp } from '@/hooks/useKeyboardShortcuts';

interface KeyboardShortcutsHelpProps {
  isOpen: boolean;
  onClose: () => void;
}

export function KeyboardShortcutsHelp({ isOpen, onClose }: KeyboardShortcutsHelpProps) {
  const { shortcuts } = useKeyboardShortcutsHelp();

  const formatKeys = (keys: string[]) => {
    return keys.map((key, index) => (
      <span key={index} className="inline-flex items-center">
        <Badge variant="outline" className="px-2 py-1 text-xs font-mono">
          {key}
        </Badge>
        {index < keys.length - 1 && <span className="mx-1 text-gray-400">+</span>}
      </span>
    ));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5" />
            Keyboard Shortcuts
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <p className="text-sm text-gray-600">
            Use these keyboard shortcuts to navigate ECHO more efficiently.
          </p>

          {shortcuts.map((category, categoryIndex) => (
            <div key={category.category}>
              <h3 className="font-semibold text-gray-900 mb-3">
                {category.category}
              </h3>
              
              <div className="space-y-2">
                {category.items.map((item, itemIndex) => (
                  <div
                    key={itemIndex}
                    className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50"
                  >
                    <span className="text-sm text-gray-700">
                      {item.description}
                    </span>
                    <div className="flex items-center gap-1">
                      {formatKeys(item.keys)}
                    </div>
                  </div>
                ))}
              </div>
              
              {categoryIndex < shortcuts.length - 1 && (
                <Separator className="mt-4" />
              )}
            </div>
          ))}

          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Pro Tips</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Shortcuts work from anywhere in the app</li>
              <li>• Press <Badge variant="outline" className="mx-1 px-1 py-0 text-xs">?</Badge> to open this help dialog</li>
              <li>• Use <Badge variant="outline" className="mx-1 px-1 py-0 text-xs">Esc</Badge> to close dialogs and modals</li>
              <li>• Search supports keyboard navigation with arrow keys</li>
            </ul>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <Button variant="outline" onClick={onClose}>
            <X className="h-4 w-4 mr-2" />
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}