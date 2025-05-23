import Link from 'next/link';
import Image from 'next/image';

export default function AssemblyAILogo() {
  return (
    <Link 
      href="https://www.assemblyai.com" 
      target="_blank" 
      rel="noopener noreferrer"
      className="block hover:opacity-80 transition-opacity"
    >
      <Image
        src="/assemblyai.png"
        alt="AssemblyAI Logo"
        width={128}
        height={128}
        className="h-16 w-auto"
        priority
      />
    </Link>
  );
} 