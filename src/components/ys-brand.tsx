import Image from 'next/image';

export default function YsBrand({ compact = false }: { compact?: boolean }) {
  return (
    <span className={compact ? 'ys-brand ys-brand-compact' : 'ys-brand'}>
      <Image
        src="/ys-solucoes-digitais.png"
        alt="YS Soluções Digitais"
        width={1536}
        height={1536}
        unoptimized
      />
      {!compact && <span><strong>YS Soluções Digitais</strong><small>Sites · Chatbots · Sistemas · Soluções sob medida</small></span>}
    </span>
  );
}
