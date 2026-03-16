export default function Step({
  number,
  title,
  desc,
}: {
  number: string;
  title: string;
  desc: string;
}) {
  return (
    <div>
      <p className="text-sm font-semibold text-gray-400">{number}</p>
      <h4 className="text-xl font-semibold mt-2">{title}</h4>
      <p className="text-gray-600 mt-3">{desc}</p>
    </div>
  );
}