const differentiators = [
  ["100% Client-side Processing", "Yes", "No"],
  ["No File Uploads Ever", "Yes", "Rarely"],
  ["Realtime Usage Stats", "Yes", "No"],
  ["Zero Account Required", "Yes", "Rarely"],
  ["Truly Free to Use", "Yes", "No"],
  ["Open, Transparent Privacy", "Yes", "No"],
  ["Monochrome, Modern UI", "Yes", "No"],
  ["Mobile Friendly & Responsive", "Yes", "Some"],
  ["Minimal, Distraction-free", "Yes", "No"],
  ["Future-focused Tech", "Yes", "No"],
];

export const WhyUsTable = () => (
  <section className="w-full max-w-2xl mx-auto mt-12 mb-10 animate-fade-in">
    <h2 className="text-xl font-bold text-white/90 font-mono mb-3 tracking-wide text-center">
      Why Docenclave vs. Others?
    </h2>
    <div className="overflow-x-auto border border-white/10 rounded-xl bg-black/90 shadow backdrop-blur-sm">
      <table className="min-w-full table-auto border-separate [border-spacing:0.5rem] text-white/90 text-sm">
        <thead>
          <tr className="text-xs uppercase text-white/60 font-bold">
            <th className="py-3 px-2 font-extrabold text-left">Features</th>
            <th className="py-3 px-2 font-extrabold text-center">Docenclave</th>
            <th className="py-3 px-2 font-extrabold text-center">Others</th>
          </tr>
        </thead>
        <tbody>
          {differentiators.map(([feature, ours, theirs], idx) => (
            <tr
              key={feature}
              className="border-b border-white/5 hover:bg-white/5 transition-colors"
            >
              <td className="py-2 px-2 font-semibold">{feature}</td>
              <td className="py-2 px-2 text-center">
                <span className="inline-block rounded font-bold bg-black/60 border border-white/10 px-3 py-1">
                  {ours}
                </span>
              </td>
              <td className="py-2 px-2 text-center">
                <span className="inline-block rounded font-bold bg-white/5 text-white/50 border border-white/10 px-3 py-1">
                  {theirs}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </section>
);
