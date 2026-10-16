import {NextResponse} from 'next/server'
import {z} from 'zod'
import {requireAdmin} from '@/lib/auth'
import {translateFields} from '@/lib/translation/server'
const schema=z.object({source:z.enum(['tr','en']),target:z.enum(['tr','en']),fields:z.record(z.string(),z.string().max(30000))}).refine((data)=>data.source!==data.target)
export async function POST(request:Request){try{const auth=await requireAdmin();if(!auth)return NextResponse.json({error:'Supabase is not configured.'},{status:503});const parsed=schema.safeParse(await request.json());if(!parsed.success)return NextResponse.json({error:'Invalid request.'},{status:400});return NextResponse.json({translations:await translateFields(parsed.data.source,parsed.data.target,parsed.data.fields)})}catch(error){return NextResponse.json({error:error instanceof Error?error.message:'Translation failed.'},{status:500})}}
