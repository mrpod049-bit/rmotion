export default function ArticlePage({ params }: { params: { slug: string } }) {
  return <main><h1>Article : {params.slug}</h1></main>;
}
