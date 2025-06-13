import { useTheme } from 'next-themes';
import { Toaster as Sonner, type ToasterProps } from 'sonner';

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = 'system' } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps['theme']}
      className="toaster group"
      position="bottom-center"
      expand={true}
      visibleToasts={9}
      toastOptions={{
        duration: 6000,
        style: {
          maxWidth: '2000px',
          wordBreak: 'break-word',
          // overflow: '-moz-initial'
          // overflow: 'auto'
        },
        // classNames: {
        //   toast: "group-[.toaster]:overflow-hidden",
        //   description: "group-[.toaster]:text-muted-foreground group-[.toaster]:overflow-hidden",
        //   actionButton: "group-[.toaster]:bg-primary group-[.toaster]:text-primary-foreground",
        //   cancelButton: "group-[.toaster]:bg-muted group-[.toaster]:text-muted-foreground",
        // },
      }}
      closeButton={true}
      gap={16}
      style={
        {
          '--normal-bg': 'var(--popover)',
          '--normal-text': 'var(--popover-foreground)',
          '--normal-border': 'var(--border)',
        } as React.CSSProperties
      }
      {...props}
    />
  );
};

export { Toaster };
