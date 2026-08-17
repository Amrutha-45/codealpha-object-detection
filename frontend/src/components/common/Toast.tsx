import { Toaster } from 'react-hot-toast'

/**
 * Global toast host. Mounted once in App.tsx.
 * Use the `toast` functions from 'react-hot-toast' anywhere to trigger
 * success/error/info notifications (e.g. toast.success('Video processed!')).
 */
export default function ToastHost() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: {
          background: '#1d2130',
          color: '#e2e8f0',
          border: '1px solid #272c3d',
          borderRadius: '0.75rem',
          fontSize: '0.875rem',
          padding: '12px 16px',
        },
        success: {
          iconTheme: { primary: '#2dd4bf', secondary: '#0f1115' },
        },
        error: {
          iconTheme: { primary: '#fb7185', secondary: '#0f1115' },
        },
      }}
    />
  )
}
