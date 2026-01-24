"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function TestTargetPage() {
  const [items, setItems] = useState([
    { id: "1", group: "Quality Standards", label: "Greeting", selected: null, comment: "" },
    { id: "2", group: "Quality Standards", label: "Tone", selected: null, comment: "" },
    { id: "3", group: "Quality Standards", label: "Name", selected: null, comment: "" },
    { id: "4", group: "Quality Standards", label: "Resolution", selected: null, comment: "" },
    { id: "5", group: "Quality Standards", label: "Accuracy", selected: null, comment: "" },
    { id: "6", group: "Call Metrics", label: "Complexity", selected: null, comment: "" },
    { id: "7", group: "Call Metrics", label: "Mood", selected: null, comment: "" },
    { id: "8", group: "Call Metrics", label: "Escalated", selected: null, comment: "" },
    { id: "9", group: "Call Metrics", label: "Dead Air", selected: null, comment: "" },
    { id: "10", group: "Call Metrics", label: "Status", selected: null, comment: "" },
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
          <div>
            <h4 className="font-semibold text-muted-foreground uppercase text-[10px]">DNIS</h4>
            <div>+1 (800) 555-0199</div>
          </div>
          <div>
            <h4 className="font-semibold text-muted-foreground uppercase text-[10px]">Call Duration</h4>
            <div>342 seconds</div>
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
                      {["Yes", "No", "N/A"].map((opt) => (
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
      
      <div className="mt-10 p-6 bg-blue-50 rounded-lg border border-blue-100">
        <h3 className="font-bold text-blue-800 mb-2">Automation Status</h3>
        <p className="text-sm text-blue-600">
          This page is ready for the bookmarklet. When you click "Generate" in the popup window, 
          the buttons and textareas above will be updated automatically.
        </p>
      </div>
    </div>
  );
}
