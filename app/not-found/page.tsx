export const runtime="nodejs";
export default function NotFound(){
  return (<main className="p-10 text-center">
    <h1 className="text-3xl font-bold mb-2">Not Found</h1>
    <p className="text-gray-600">The page you’re looking for doesn’t exist.</p>
  </main>);
}
