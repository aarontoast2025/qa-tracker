"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";

interface TargetItem {
  id: string;
  group: string;
  label: string;
  options: string[];
  selected: string | null;
  comment: string;
}

export default function TestTargetPage() {
  const [items, setItems] = useState<TargetItem[]>([
    { id: "1", group: "Quality Standards", label: "Greeting", options: ["Yes", "No", "N/A"], selected: null, comment: "" },
    { id: "2", group: "Quality Standards", label: "Tone", options: ["Yes", "No", "N/A"], selected: null, comment: "" },
    { id: "3", group: "Quality Standards", label: "Name", options: ["Yes", "No", "N/A"], selected: null, comment: "" },
    { id: "4", group: "Quality Standards", label: "Resolution", options: ["Yes", "No", "N/A"], selected: null, comment: "" },
    { id: "5", group: "Quality Standards", label: "Accuracy", options: ["Yes", "No", "N/A"], selected: null, comment: "" },
    { id: "6", group: "Call Metrics", label: "Complexity", options: ["Low", "Medium", "High"], selected: null, comment: "" },
    { id: "7", group: "Call Metrics", label: "Mood", options: ["Happy", "Neutral", "Upset"], selected: null, comment: "" },
    { id: "8", group: "Call Metrics", label: "Escalated", options: ["Yes", "No", "N/A"], selected: null, comment: "" },
    { id: "9", group: "Call Metrics", label: "Dead Air", options: ["Yes", "No", "N/A"], selected: null, comment: "" },
    { id: "10", group: "Call Metrics", label: "Status", options: ["Resolved", "Pending", "Cancelled"], selected: null, comment: "" },
  ]);

  const handleSelect = (id: string, val: string) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, selected: val } : item));
  };

  const handleComment = (id: string, val: string) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, comment: val } : item));
  };

  return (
    <div className="max-w-4xl mx-auto py-10 px-6">
      <div className="mb-8 border-b pb-6">
        <h1 className="text-2xl font-bold mb-4">MOCK CRM - Target Audit Page</h1>
        <div className="grid grid-cols-2 gap-4 text-sm review-info">
          <div>
            <h4 className="font-semibold text-muted-foreground uppercase text-[10px]">Interaction ID</h4>
            <div className="text-lg font-mono">INT-998877</div>
          </div>
          <div>
            <h4 className="font-semibold text-muted-foreground uppercase text-[10px]">Advocate Name</h4>
            <h2 className="text-lg font-semibold">John Doe</h2>
          </div>
        </div>
      </div>

      <div className="space-y-8">
        {["Quality Standards", "Call Metrics"].map(groupName => (
          <div key={groupName} className="padding-xlarge border rounded-lg p-6 bg-slate-50/50">
            <h2 className="text-xl font-bold mb-6 text-blue-700">{groupName}</h2>
            <div className="space-y-6">
              {items.filter(i => i.group === groupName).map((item) => (
                <div key={item.id} data-idx={item.id} className="bg-white p-4 rounded border shadow-sm space-y-3">
                  <div className="flex justify-between items-center">
                    <Label className="font-semibold">{item.id}. {item.label}</Label>
                    <div data-testid="SegmentedControl" className="flex gap-1 bg-slate-100 p-1 rounded">
                      {item.options.map((opt) => (
                        <button
                          key={opt}
                          onClick={() => handleSelect(item.id, opt)}
                          className={`px-4 py-1 rounded text-sm transition-all ${
                            item.selected === opt 
                            ? "bg-white shadow-sm text-blue-600 font-bold" 
                            : "text-slate-500 hover:bg-white/50"
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                  <textarea
                    placeholder="Internal comments..."
                    className="w-full text-sm border rounded p-2 h-16"
                    value={item.comment}
                    onChange={(e) => handleComment(item.id, e.target.value)}
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
