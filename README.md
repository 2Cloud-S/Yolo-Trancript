# Transcription Micro SaaS

A modern web application that allows users to upload audio and video files for transcription using AssemblyAI. The application is built with Next.js, React, Supabase for authentication and database, and is deployed on Vercel.

## Features

- User authentication with Supabase
- File uploads with drag-and-drop interface
- Transcription using AssemblyAI's powerful speech-to-text API
- Dashboard to view and manage transcriptions
- Real-time status updates for transcription jobs

## Technologies Used

- **Frontend**: Next.js, React, TailwindCSS
- **Authentication & Database**: Supabase
- **Transcription**: AssemblyAI API
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 16.x or later
- A Supabase account
- An AssemblyAI API key

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd transcription-micro-saas
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. **IMPORTANT**: Create a `.env.local` file in the root directory with the following variables:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
   ASSEMBLY_API_KEY=your-assemblyai-api-key
   ```

   > ⚠️ The application will not function properly without these environment variables. You'll see a helpful warning message if any are missing.

   To get your Supabase credentials:
   - Go to your Supabase project dashboard
   - Click on the "Settings" icon (gear icon) in the sidebar
   - Go to "API" section
   - Copy the URL and anon/public key

   To get your AssemblyAI API key:
   - Sign up or log in to [AssemblyAI](https://www.assemblyai.com/)
   - Go to your dashboard
   - Copy your API key

### Supabase Setup

1. Create a new Supabase project
2. Create a new table called `transcripts` with the following columns:
   - `id` (uuid, primary key)
   - `user_id` (uuid, foreign key to auth.users)
   - `title` (text)
   - `file_name` (text)
   - `transcript_id` (text)
   - `status` (text)
   - `text` (text, nullable)
   - `created_at` (timestamp with time zone, default: now())
   - `updated_at` (timestamp with time zone, default: now())

3. Set up Row Level Security (RLS) policies for the `transcripts` table:
   - Enable RLS on the table
   - Create a policy that allows users to select only their own transcripts
   - Create a policy that allows users to insert only their own transcripts
   - Create a policy that allows users to update only their own transcripts

### Running Locally

```bash
npm run dev
```

Visit `http://localhost:3000` to see the application.

### Deployment

The application can be easily deployed to Vercel:

1. Connect your GitHub repository to Vercel
2. Set the environment variables in the Vercel dashboard
3. Deploy with the default settings

## Troubleshooting

### Missing Environment Variables

If you see an error like `Missing Supabase environment variables` or notice that authentication isn't working:

1. Make sure you've created a `.env.local` file with all the required variables
2. Double-check that your Supabase and AssemblyAI API keys are correct
3. Restart your development server after adding or changing environment variables

## License

[MIT](LICENSE)
