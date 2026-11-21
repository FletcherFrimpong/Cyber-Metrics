'use client'

import { Button } from '@/components/ui/button'
import { RefreshCw } from 'lucide-react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html>
      <body>
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="text-center space-y-6">
            <div className="space-y-2">
              <h1 className="text-4xl font-bold text-red-500">Critical Error</h1>
              <p className="text-neutral-500 max-w-md">
                A critical error occurred. Please refresh the page or contact support.
              </p>
              {error.digest && (
                <p className="text-xs text-neutral-500 tabular-nums">
                  Error ID: {error.digest}
                </p>
              )}
            </div>
            
            <Button onClick={reset} className="bg-neutral-900 hover:bg-neutral-800">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh Page
            </Button>
          </div>
        </div>
      </body>
    </html>
  )
} 