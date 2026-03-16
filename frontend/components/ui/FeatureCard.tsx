export default function FeatureCard({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="bg-white border rounded-xl p-6 hover:shadow-lg transition">
      <div className="mb-4 text-black">{icon}</div>
      <h4 className="font-semibold text-lg">{title}</h4>
      <p className="text-gray-600 mt-2 text-sm">{desc}</p>
    </div>
  );
}
