export default function cn(...classes: (string | undefined | false)[]) {
  return classes.filter(Boolean).join(" ");
}
