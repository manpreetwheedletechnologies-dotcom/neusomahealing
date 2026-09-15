import Image from "next/image";

export function LeafBranch({ className = "" }: { className?: string }) {
  return (
    <div className={className}>
      <Image
        src="/images/leaf.png"
        alt=""
        fill
        priority={false}
        className="object-contain object-right-bottom"
        sizes="440px"
        aria-hidden="true"
      />
    </div>
  );
}