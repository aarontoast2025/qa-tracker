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
  showComment: boolean;
}

export default function TestTargetPage() {
  const [items, setItems] = useState<TargetItem[]>([
    { id: "1", group: "Quality Standards", label: "Greeting", options: ["Yes", "No", "N/A"], selected: null, comment: "", showComment: false },
    { id: "2", group: "Quality Standards", label: "Tone", options: ["Yes", "No", "N/A"], selected: null, comment: "", showComment: false },
    { id: "3", group: "Quality Standards", label: "Name", options: ["Yes", "No", "N/A"], selected: null, comment: "", showComment: false },
    { id: "4", group: "Quality Standards", label: "Resolution", options: ["Yes", "No", "N/A"], selected: null, comment: "", showComment: false },
    { id: "5", group: "Quality Standards", label: "Accuracy", options: ["Yes", "No", "N/A"], selected: null, comment: "", showComment: false },
    { id: "6", group: "Call Metrics", label: "Complexity", options: ["Low", "Medium", "High"], selected: null, comment: "", showComment: false },
    { id: "7", group: "Call Metrics", label: "Mood", options: ["Happy", "Neutral", "Upset"], selected: null, comment: "", showComment: false },
    { id: "8", group: "Call Metrics", label: "Escalated", options: ["Yes", "No", "N/A"], selected: null, comment: "", showComment: false },
    { id: "9", group: "Call Metrics", label: "Dead Air", options: ["Yes", "No", "N/A"], selected: null, comment: "", showComment: false },
    { id: "10", group: "Call Metrics", label: "Status", options: ["Resolved", "Pending", "Cancelled"], selected: null, comment: "", showComment: false },
  ]);

  const handleSelect = (id: string, val: string) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, selected: val } : item));
    
    // Simulate StellaConnect: Textarea appears after a short delay/animation
    setTimeout(() => {
      setItems(prev => prev.map(item => item.id === id ? { ...item, showComment: true } : item));
    }, 800);
  };

  return (
    <div className="max-w-4xl mx-auto py-10 px-6 bg-[#f9fafb] min-h-screen font-sans">
      <div className="mb-8 border-b pb-6 review-info bg-white p-6 rounded-t-xl shadow-sm">
        <h4 className="text-gray-400 text-xs font-bold uppercase tracking-wider">Interaction ID</h4>
        <div className="text-xl font-bold mb-4">INT-123456789</div>
        <h4 className="text-gray-400 text-xs font-bold uppercase tracking-wider">Advocate Name</h4>
        <h2 className="text-2xl font-black text-gray-800">John Doe</h2>
      </div>

      <div className="space-y-10">
        {["Quality Standards", "Call Metrics"].map(groupName => (
          <div key={groupName} className="padding-xlarge bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            <h2 className="text-lg font-bold p-4 border-b bg-gray-50 text-gray-700">{groupName}</h2>
            <div className="divide-y">
              {items.filter(i => i.group === groupName).map((item) => (
                <div key={item.id} data-idx={item.id} className="p-6 space-y-4">
                  <div className="flex justify-between items-start gap-8">
                    <Label className="text-base font-semibold text-gray-800 leading-tight flex-1">
                        {item.id}. {item.label}
                    </Label>
                    <div data-testid="SegmentedControl" className="flex gap-0.5 bg-gray-100 p-1 rounded-lg border border-gray-200">
                      {item.options.map((opt) => (
                        <button
                          key={opt}
                          onClick={() => handleSelect(item.id, opt)}
                          className={`px-5 py-2 rounded-md text-sm font-bold transition-all ${
                            item.selected === opt 
                            ? "bg-white shadow-md text-blue-600 scale-105" 
                            : "text-gray-400 hover:text-gray-600"
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {item.showComment && (
                    <div className="animate-in fade-in slide-in-from-top-2 duration-500">
                        <textarea
                            placeholder="Internal comments..."
                            className="w-full text-sm border border-gray-200 rounded-lg p-3 h-20 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            defaultValue={item.comment}
                        />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}