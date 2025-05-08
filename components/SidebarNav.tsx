'use client';

import React from 'react';
import { Button } from "@/components/ui/button";
import {
    Inbox,
    Send,
    FileText,
    ArchiveX,
    Trash2,
    Label,
    PlusCircle,
    AlertCircle
} from "lucide-react";

// Re-define or import from a shared types file
interface GmailLabel {
    id: string;
    name: string;
    type?: string; // 'system' or 'user'
    messagesUnread?: number;
    color?: { backgroundColor?: string; textColor?: string; };
}

interface SidebarNavProps {
    labels: GmailLabel[];
    onSelectLabel: (labelId: string | null) => void; // Callback for when a label/folder is clicked
    onComposeClick: () => void;
    isLoadingLabels: boolean;
    labelsError: string | null;
}

const systemIcons: { [key: string]: React.ElementType } = {
    INBOX: Inbox,
    SENT: Send,
    DRAFTS: FileText,
    SPAM: AlertCircle,
    TRASH: Trash2,
};

const SidebarNav: React.FC<SidebarNavProps> = ({ labels, onSelectLabel, onComposeClick, isLoadingLabels, labelsError }) => {

    const systemLabels = labels.filter(l => l.type === 'system' && systemIcons[l.id]);
    const userLabels = labels.filter(l => l.type === 'user');

    return (
        <div className="flex flex-col h-full">
            <div className="p-4">
                <Button
                    onClick={onComposeClick}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-md"
                    size="lg"
                >
                    <PlusCircle className="mr-2 h-5 w-5" /> Compose
                </Button>
            </div>

            <nav className="flex-1 space-y-1 px-2 py-4 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
                {/* System Labels */}
                {systemLabels.map((label) => {
                    const Icon = systemIcons[label.id] || Label; // Default to generic label icon
                    return (
                        <Button
                            key={label.id}
                            variant="ghost"
                            className="w-full justify-start text-gray-300 hover:bg-gray-700 hover:text-white"
                            onClick={() => onSelectLabel(label.id)}
                        >
                            <Icon className="mr-3 h-5 w-5" />
                            <span className="flex-1 truncate">{label.name}</span>
                            {label.messagesUnread && label.messagesUnread > 0 && (
                                <span className="ml-auto text-xs bg-gray-600 text-gray-200 rounded-full px-2 py-0.5">
                                    {label.messagesUnread}
                                </span>
                            )}
                        </Button>
                    );
                })}

                {/* Separator */}
                <div className="pt-4 mt-4 border-t border-gray-700">
                    <h3 className="px-2 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Labels</h3>
                </div>

                {/* User Labels */}
                {isLoadingLabels && <p className="px-2 text-sm text-gray-400">Loading labels...</p>}
                {labelsError && <p className="px-2 text-sm text-red-400">Error loading labels.</p>}
                {!isLoadingLabels && userLabels.map((label) => (
                    <Button
                        key={label.id}
                        variant="ghost"
                        className="w-full justify-start text-gray-300 hover:bg-gray-700 hover:text-white group"
                        onClick={() => onSelectLabel(label.id)}
                    >
                        <span
                            className="mr-3 h-3 w-3 rounded-full inline-block border border-gray-500"
                            style={{ backgroundColor: label.color?.backgroundColor || 'transparent' }}
                        ></span>
                        <span className="flex-1 truncate">{label.name}</span>
                        {label.messagesUnread && label.messagesUnread > 0 && (
                            <span className="ml-auto text-xs bg-gray-600 text-gray-200 rounded-full px-2 py-0.5">
                                {label.messagesUnread}
                            </span>
                        )}
                    </Button>
                ))
                }
                {!isLoadingLabels && userLabels.length === 0 && !labelsError &&
                    <p className="px-2 text-sm text-gray-500">No user labels found.</p>}

            </nav>
        </div>
    );
};

export default SidebarNav; 