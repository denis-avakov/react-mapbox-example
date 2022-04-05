type PinProps = {
  amount: number;
  name?: string;
};

export default function Pin(props: PinProps) {
  return (
    <div className="rounded-full bg-slate-200 px-2 opacity-95 outline outline-1 outline-slate-400 drop-shadow-sm">
      <span className="text-sm font-medium text-gray-900">{props.amount}</span>
      {props.name && <span className="ml-1 text-sm text-gray-500">{props.name}</span>}
    </div>
  );
}
