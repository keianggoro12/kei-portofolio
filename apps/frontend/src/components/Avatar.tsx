import { profile } from '@kei/shared';
import { cn } from '@/lib/utils';

/** Foto bulat kecil. Foto aslinya seluruh badan, jadi di-zoom ke wajah. */
export function Avatar({ className }: { className?: string }) {
  return (
    <span className={cn('relative block shrink-0 overflow-hidden rounded-full bg-muted', className)}>
      <img src={profile.photo} alt={profile.name} className="h-full w-full origin-[31%_22%] scale-[5] object-cover" />
    </span>
  );
}
