import type { AppProps } from "@/lib/types";
import type { FC, ReactNode } from "react";

// Root wrapper component with padding
const Root: FC<{ children: ReactNode }> = ({ children }) => (
  <div className="bg-linktree-primary box-border py-4">{children}</div>
);

export const Flex: FC<AppProps> = (props: AppProps) => {
  // Function to format numbers with K/M suffixes
  const formatValue = (value: string) => {
    // Check if the value is a pure number (no letters or special chars except . and -)
    const cleanValue = value.trim();
    if (/^-?\d+(\.\d+)?$/.test(cleanValue)) {
      const num = Number.parseFloat(cleanValue);
      // Format large numbers with K or M suffix
      if (num >= 1000000) {
        return `${(num / 1000000).toFixed(num % 1000000 === 0 ? 0 : 1)}M`;
      }
      if (num >= 1000) {
        return `${(num / 1000).toFixed(num % 1000 === 0 ? 0 : 1)}K`;
      }
      return new Intl.NumberFormat("en-US").format(num);
    }
    return value;
  };

  // Get stats from the array
  const stats = props.statsList || [];

  // If no stats are configured, show a placeholder
  if (stats.length === 0) {
    return (
      <Root>
        <div className="rounded-linktree bg-linktree-primary px-6 py-8">
          <div className="text-center text-linktree-button-text/70">
            <p className="text-sm">No Stats Yet</p>
          </div>
        </div>
      </Root>
    );
  }

  // Determine grid layout - always 2 columns max
  const getGridClass = () => {
    if (stats.length === 1) return "grid-cols-1";
    return "grid-cols-2";
  };

  // Determine text size based on number of stats
  const getTextSizeClasses = () => {
    if (stats.length === 1) {
      return {
        value: "text-4xl sm:text-5xl",
        name: "text-base sm:text-lg",
      };
    }
    if (stats.length === 2) {
      return {
        value: "text-2xl sm:text-3xl",
        name: "text-sm sm:text-base",
      };
    }
    if (stats.length <= 4) {
      return {
        value: "text-xl sm:text-2xl",
        name: "text-xs sm:text-sm",
      };
    }
    // 5-6 stats
    return {
      value: "text-lg sm:text-xl",
      name: "text-xs",
    };
  };

  // Determine padding based on number of stats
  const getPaddingClass = () => {
    if (stats.length === 1) return "px-8 py-8";
    if (stats.length === 2) return "px-6 py-6";
    return "px-5 py-5";
  };

  // Determine gap based on number of stats
  const getGapClass = () => {
    if (stats.length === 1) return "";
    if (stats.length === 2) return "gap-x-6 gap-y-5";
    if (stats.length <= 4) return "gap-x-4 gap-y-4";
    return "gap-x-3 gap-y-3";
  };

  const textSizes = getTextSizeClasses();

  return (
    <Root>
      <div
        className={`${getPaddingClass()} rounded-linktree bg-linktree-primary`}
      >
        <div className={`grid ${getGridClass()} ${getGapClass()}`}>
          {stats.map((stat) => (
            <div
              key={`${stat.name}-${stat.value}`}
              className="flex flex-col justify-center text-center"
            >
              <div
                className={`${textSizes.value} font-bold leading-none tracking-tight text-linktree-button-text`}
              >
                {formatValue(stat.value)}
              </div>
              <div
                className={`${textSizes.name} mt-1.5 font-normal leading-tight text-linktree-button-text/70`}
              >
                {stat.name}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Root>
  );
};
