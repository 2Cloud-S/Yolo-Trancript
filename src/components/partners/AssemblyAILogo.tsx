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
        src="https://www.assemblyai.com/_next/image?url=%2F_next%2Fstatic%2Fmedia%2Flogo.5c2c4c4c.png&w=256&q=75"
        alt="AssemblyAI Logo"
        width={200}
        height={50}
        className="rounded-lg"
      />
    </Link>
  );
} 