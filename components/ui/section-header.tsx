import React, { FC, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { ChevronDown, ChevronUp, HelpCircle, Info, Settings, Sparkles } from 'lucide-react';

interface SectionHeaderProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  children?: React.ReactNode;
  badge?: string;
  variant?: 'default' | 'primary' | 'secondary' | 'accent';
  size?: 'small' | 'medium' | 'large';
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  onCollapseChange?: (collapsed: boolean) => void;
  actions?: React.ReactNode;
  helpText?: string;
  className?: string;
  showDivider?: boolean;
  level?: 1 | 2 | 3 | 4;
}

const SectionHeader: FC<SectionHeaderProps> = ({
  title,
  description,
  icon,
  children,
  badge,
  variant = 'default',
  size = 'medium',
  collapsible = false,
  defaultCollapsed = false,
  onCollapseChange,
  actions,
  helpText,
  className,
  showDivider = true,
  level = 2
}) => {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

  const handleToggleCollapse = () => {
    const newCollapsed = !isCollapsed;
    setIsCollapsed(newCollapsed);
    onCollapseChange?.(newCollapsed);
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return {
          container: 'border-l-4 border-primary bg-primary/5',
          title: 'text-primary',
          icon: 'text-primary'
        };
      case 'secondary':
        return {
          container: 'border-l-4 border-secondary bg-secondary/5',
          title: 'text-secondary-foreground',
          icon: 'text-secondary-foreground'
        };
      case 'accent':
        return {
          container: 'border-l-4 border-accent bg-accent/5',
          title: 'text-accent-foreground',
          icon: 'text-accent-foreground'
        };
      default:
        return {
          container: 'border-l-4 border-muted bg-muted/5',
          title: 'text-foreground',
          icon: 'text-muted-foreground'
        };
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          container: 'p-3',
          title: 'text-sm',
          description: 'text-xs',
          icon: 'h-4 w-4'
        };
      case 'large':
        return {
          container: 'p-6',
          title: 'text-xl',
          description: 'text-base',
          icon: 'h-6 w-6'
        };
      default:
        return {
          container: 'p-4',
          title: 'text-lg',
          description: 'text-sm',
          icon: 'h-5 w-5'
        };
    }
  };

  const getHeadingTag = () => {
    switch (level) {
      case 1: return 'h1';
      case 2: return 'h2';
      case 3: return 'h3';
      case 4: return 'h4';
      default: return 'h2';
    }
  };

  const variantStyles = getVariantStyles();
  const sizeStyles = getSizeStyles();
  const HeadingTag = getHeadingTag() as keyof JSX.IntrinsicElements;

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header */}
      <div className={cn("rounded-lg transition-all duration-200", variantStyles.container, sizeStyles.container)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            {/* Icon */}
            {icon && (
              <div className={cn("flex-shrink-0", variantStyles.icon)}>
                {React.cloneElement(icon as React.ReactElement, {
                  className: cn(sizeStyles.icon, (icon as React.ReactElement).props.className)
                })}
              </div>
            )}

            {/* Title and Description */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <HeadingTag className={cn("font-semibold", variantStyles.title, sizeStyles.title)}>
                  {title}
                </HeadingTag>
                
                {badge && (
                  <Badge variant="secondary" className="text-xs">
                    {badge}
                  </Badge>
                )}

                {helpText && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                    title={helpText}
                  >
                    <HelpCircle className="h-4 w-4" />
                  </Button>
                )}
              </div>

              {description && (
                <p className={cn("text-muted-foreground", sizeStyles.description)}>
                  {description}
                </p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {actions}
            
            {collapsible && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleToggleCollapse}
                className="h-8 w-8 p-0"
              >
                {isCollapsed ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronUp className="h-4 w-4" />
                )}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      {children && !isCollapsed && (
        <div className="space-y-4">
          {children}
        </div>
      )}

      {/* Divider */}
      {showDivider && (
        <Separator className="my-6" />
      )}
    </div>
  );
};

// Preset variations for common section types
export const ColorSectionHeader: FC<Omit<SectionHeaderProps, 'icon' | 'variant'>> = (props) => (
  <SectionHeader
    {...props}
    icon={<Sparkles />}
    variant="primary"
  />
);

export const LayoutSectionHeader: FC<Omit<SectionHeaderProps, 'icon' | 'variant'>> = (props) => (
  <SectionHeader
    {...props}
    icon={<Settings />}
    variant="secondary"
  />
);

export const InfoSectionHeader: FC<Omit<SectionHeaderProps, 'icon' | 'variant'>> = (props) => (
  <SectionHeader
    {...props}
    icon={<Info />}
    variant="accent"
  />
);

export default SectionHeader; 