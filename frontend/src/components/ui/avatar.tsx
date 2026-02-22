import { getInitials, stringToColor } from "@/lib/hooks";

interface AvatarProps {
  name: string;
  image?: string;
  size?: "sm" | "md" | "lg" | "xl";
}

const sizeClasses = {
  sm: "w-8 h-8 text-xs",
  md: "w-10 h-10 text-sm",
  lg: "w-12 h-12 text-base",
  xl: "w-16 h-16 text-lg",
};

export function Avatar({ name, image, size = "md" }: AvatarProps) {
  const initials = getInitials(name);
  const bgColor = stringToColor(name);

  if (image) {
    return (
      <div className={`${sizeClasses[size]} rounded-full overflow-hidden flex-shrink-0`}>
        <img src={image} alt={name} className="w-full h-full object-cover" />
      </div>
    );
  }

  return (
    <div
      className={`
        ${sizeClasses[size]} ${bgColor}
        rounded-full flex items-center justify-center font-semibold text-white flex-shrink-0
      `}
    >
      {initials}
    </div>
  );
}

interface AvatarGroupProps {
  items: { name: string; image?: string }[];
  max?: number;
  size?: "sm" | "md" | "lg";
}

export function AvatarGroup({ items, max = 4, size = "sm" }: AvatarGroupProps) {
  const visible = items.slice(0, max);
  const remaining = items.length - max;

  return (
    <div className="flex -space-x-2">
      {visible.map((item, index) => (
        <div key={index} className="ring-2 ring-neutral-900 rounded-full">
          <Avatar name={item.name} image={item.image} size={size} />
        </div>
      ))}
      {remaining > 0 && (
        <div
          className={`
            ${sizeClasses[size]} bg-neutral-700
            rounded-full flex items-center justify-center font-medium text-white
            ring-2 ring-neutral-900
          `}
        >
          +{remaining}
        </div>
      )}
    </div>
  );
}
