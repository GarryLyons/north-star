"use client";

import { useAuthenticator } from "@aws-amplify/ui-react";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import Breadcrumbs from "@/components/Breadcrumbs";
import RichTextEditor from "@/components/RichTextEditor";
import { createStage } from "@/app/actions/institutions";

// Types
interface CaregiverTip { summary: string; description: string; }
interface OnlineResource { title: string; url: string; }

export default function NewStage() {
    const router = useRouter();
    const params = useParams();
    const { user } = useAuthenticator((context) => [context.user]);

    // Basic Info
    const [title, setTitle] = useState("");
    const [summary, setSummary] = useState("");
    const [introduction, setIntroduction] = useState("");
    const [duration, setDuration] = useState(1);
    const [order, setOrder] = useState(1);

    // How You Might Feel
    const [hymfTitle, setHymfTitle] = useState("How You Might Feel");
    const [hymfDescription, setHymfDescription] = useState("");

    // Complex Info
    const [tips, setTips] = useState<CaregiverTip[]>([]);
    const [questions, setQuestions] = useState<string[]>([]);
    const [resources, setResources] = useState<OnlineResource[]>([]);

    // Temp State
    const [newTip, setNewTip] = useState({ summary: "", description: "" });
    const [newQuestion, setNewQuestion] = useState("");
    const [newResource, setNewResource] = useState({ title: "", url: "" });

    const { id: institutionId, deptId: departmentId, pathId: pathwayId } = params as { id: string, deptId: string, pathId: string };

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        const stageData = {
            title,
            summary,
            introduction,
            howYouMightFeelTitle: hymfTitle,
            howYouMightFeelDescription: hymfDescription,
            estimatedDuration: duration,
            order,
            caregiverTips: tips,
            reflectiveQuestions: questions,
            onlineResources: resources,
            faqs: []
        };

        try {
            await createStage(pathwayId, stageData);
            router.push(`/institutions/${institutionId}/departments/${departmentId}/pathways/${pathwayId}`);
        } catch (error) {
            console.error(error);
            alert("Failed to save stage");
        }
    }

    // Helpers
    const addTip = () => { if (newTip.summary) { setTips([...tips, newTip]); setNewTip({ summary: "", description: "" }); } };
    const removeTip = (idx: number) => setTips(tips.filter((_, i) => i !== idx));

    const addQuestion = () => { if (newQuestion) { setQuestions([...questions, newQuestion]); setNewQuestion(""); } };
    const removeQuestion = (idx: number) => setQuestions(questions.filter((_, i) => i !== idx));

    const addResource = () => { if (newResource.title && newResource.url) { setResources([...resources, newResource]); setNewResource({ title: "", url: "" }); } };
    const removeResource = (idx: number) => setResources(resources.filter((_, i) => i !== idx));

    return (
        <div className="max-w-4xl">
            <Breadcrumbs
                items={[
                    { name: "Pathway", href: `/institutions/${institutionId}/departments/${departmentId}/pathways/${pathwayId}`, current: false },
                    { name: "New Stage", href: "#", current: true },
                ]}
            />

            <h1 className="text-2xl font-semibold text-gray-900 mb-6">Add New Stage</h1>

            <form onSubmit={handleSubmit} className="space-y-8 divide-y divide-gray-200">

                {/* Basic Info */}
                <div className="space-y-6 pt-0">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Stage Title</label>
                        <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm border px-3 py-2" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Summary</label>
                        <input type="text" value={summary} onChange={(e) => setSummary(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm border px-3 py-2" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Duration (Days)</label>
                            <input type="number" value={duration} onChange={(e) => setDuration(Number(e.target.value))} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm border px-3 py-2" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Order</label>
                            <input type="number" value={order} onChange={(e) => setOrder(Number(e.target.value))} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm border px-3 py-2" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Introduction</label>
                        <RichTextEditor value={introduction} onChange={setIntroduction} />
                    </div>
                </div>

                {/* How You Might Feel */}
                <div className="pt-8">
                    <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">How You Might Feel</h3>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700">Section Title</label>
                        <input type="text" value={hymfTitle} onChange={(e) => setHymfTitle(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm border px-3 py-2" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                        <RichTextEditor value={hymfDescription} onChange={setHymfDescription} />
                    </div>
                </div>

                {/* Caregiver Tips */}
                <div className="pt-8">
                    <h3 className="text-lg font-medium leading-6 text-gray-900">Caregiver Tips</h3>
                    <div className="mt-4 space-y-4">
                        {tips.map((tip, idx) => (
                            <div key={idx} className="flex justify-between items-center bg-gray-50 p-3 rounded-md">
                                <div>
                                    <p className="font-semibold text-sm">{tip.summary}</p>
                                    <div className="text-xs text-gray-500" dangerouslySetInnerHTML={{ __html: tip.description }} />
                                </div>
                                <button type="button" onClick={() => removeTip(idx)} className="text-red-600 text-sm hover:text-red-800">Remove</button>
                            </div>
                        ))}
                    </div>
                    <div className="mt-4 grid grid-cols-1 gap-y-4 gap-x-4 sm:grid-cols-6 items-end bg-gray-50 p-4 rounded-md border border-dashed border-gray-300">
                        <div className="sm:col-span-2">
                            <label className="block text-xs font-medium text-gray-500">Summary</label>
                            <input type="text" value={newTip.summary} onChange={e => setNewTip({ ...newTip, summary: e.target.value })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm text-sm border px-2 py-1" />
                        </div>
                        <div className="sm:col-span-3">
                            <label className="block text-xs font-medium text-gray-500">Description (HTML supported)</label>
                            <input type="text" value={newTip.description} onChange={e => setNewTip({ ...newTip, description: e.target.value })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm text-sm border px-2 py-1" />
                        </div>
                        <div className="sm:col-span-1">
                            <button type="button" onClick={addTip} className="w-full rounded-md bg-white border border-gray-300 py-1.5 text-sm font-semibold text-gray-900 shadow-sm hover:bg-gray-50">Add</button>
                        </div>
                    </div>
                </div>

                {/* Questions */}
                <div className="pt-8">
                    <h3 className="text-lg font-medium leading-6 text-gray-900">Reflective Questions</h3>
                    <ul className="mt-4 list-disc pl-5 space-y-1">
                        {questions.map((q, idx) => (
                            <li key={idx} className="text-sm text-gray-700">
                                {q} <button type="button" onClick={() => removeQuestion(idx)} className="ml-2 text-red-600 text-xs hover:text-red-800">(Remove)</button>
                            </li>
                        ))}
                    </ul>
                    <div className="mt-4 flex gap-2">
                        <input type="text" value={newQuestion} onChange={e => setNewQuestion(e.target.value)} placeholder="Type question..." className="block w-full rounded-md border-gray-300 shadow-sm text-sm border px-3 py-2" />
                        <button type="button" onClick={addQuestion} className="rounded-md bg-white border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm hover:bg-gray-50">Add</button>
                    </div>
                </div>

                {/* Resources */}
                <div className="pt-8 mb-8">
                    <h3 className="text-lg font-medium leading-6 text-gray-900">Online Resources</h3>
                    <div className="mt-4 space-y-2">
                        {resources.map((r, idx) => (
                            <div key={idx} className="flex justify-between items-center text-sm p-2 bg-gray-50 rounded">
                                <a href={r.url} target="_blank" className="text-indigo-600 hover:underline">{r.title}</a>
                                <button type="button" onClick={() => removeResource(idx)} className="text-red-600 text-xs hover:text-red-800">Remove</button>
                            </div>
                        ))}
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-md border border-dashed border-gray-300">
                        <div>
                            <input type="text" placeholder="Title" value={newResource.title} onChange={e => setNewResource({ ...newResource, title: e.target.value })} className="block w-full rounded-md border-gray-300 shadow-sm text-sm border px-3 py-2" />
                        </div>
                        <div className="flex gap-2">
                            <input type="text" placeholder="URL" value={newResource.url} onChange={e => setNewResource({ ...newResource, url: e.target.value })} className="block w-full rounded-md border-gray-300 shadow-sm text-sm border px-3 py-2" />
                            <button type="button" onClick={addResource} className="rounded-md bg-white border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm hover:bg-gray-50">Add</button>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-x-4 pt-8 border-t border-gray-200">
                    <button type="button" onClick={() => router.back()} className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50">Cancel</button>
                    <button type="submit" className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500">Create Stage</button>
                </div>
            </form>
        </div>
    );
}
