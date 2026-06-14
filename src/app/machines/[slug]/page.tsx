export default function MachinePage({ params }: { params: { slug: string } }) {
  return <main><h1>Machine : {params.slug}</h1></main>;
}
