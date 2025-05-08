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
    AlertCircle,
    Star,
    Clock,
    Tag,
    Mail,
    Settings,
    ChevronDown, ChevronUp, Play
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

// Expand the icon mapping
const systemIcons: { [key: string]: React.ElementType } = {
    INBOX: Inbox,
    STARRED: Star,
    SNOOZED: Clock,
    SENT: Send,
    DRAFTS: FileText,
    IMPORTANT: Tag,
    SCHEDULED: Clock,
    ALL: Mail,
    SPAM: AlertCircle,
    TRASH: Trash2,
    MANAGE_LABELS: Settings,
    CREATE_LABEL: PlusCircle,
};

// Define the standard order and structure for system labels
const standardSystemLabels = [
    { id: 'INBOX', name: 'Inbox' },
    { id: 'STARRED', name: 'Starred' },
    { id: 'SNOOZED', name: 'Snoozed' },
    { id: 'SENT', name: 'Sent' },
    { id: 'DRAFTS', name: 'Drafts' },
    { id: 'IMPORTANT', name: 'Important' },
    { id: 'SCHEDULED', name: 'Scheduled' },
    { id: 'ALL', name: 'All Mail' },
    { id: 'SPAM', name: 'Spam' },
    { id: 'TRASH', name: 'Trash' },
];

const SidebarNav: React.FC<SidebarNavProps> = ({ labels, onSelectLabel, onComposeClick, isLoadingLabels, labelsError }) => {

    // Create a map for quick lookup of label data from the API
    const labelDataMap = new Map<string, GmailLabel>();
    labels.forEach(label => labelDataMap.set(label.id, label));

    const userLabels = labels.filter(l => l.type === 'user');

    return (
        <div className="flex flex-col h-full">
            <div className="p-4">
                <Button
                    onClick={onComposeClick}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-md rounded-2xl"
                    size="lg"
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" className="mr-2" fill="currentColor"><path d="M22 5.18L12 12.18L2 5.18V19h20V5.18M12 10.18L21.4 4H2.6L12 10.18M2 3h20c1.1 0 2 .9 2 2v14c0 1.1-.9 2-2 2H2c-1.1 0-2-.9-2-2V5c0-1.1.9-2 2-2"></path></svg>
                    Compose
                </Button>
            </div>

            <nav className="flex-1 space-y-1 px-2 py-2 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
                {/* Standard System Labels */}
                {standardSystemLabels.map((stdLabel) => {
                    const apiData = labelDataMap.get(stdLabel.id);
                    const Icon = systemIcons[stdLabel.id] || Label;
                    const unreadCount = apiData?.messagesUnread;
                    const displayName = apiData?.name || stdLabel.name;

                    return (
                        <Button
                            key={stdLabel.id}
                            variant="ghost"
                            className="w-full justify-start text-gray-300 hover:bg-gray-700 hover:text-white rounded-r-full rounded-l-none data-[selected=true]:bg-blue-800 data-[selected=true]:text-white"
                            onClick={() => onSelectLabel(stdLabel.id)}
                        >
                            <Icon className="mr-4 h-5 w-5 flex-shrink-0" />
                            <span className="flex-1 truncate text-sm font-medium">{displayName}</span>
                            {unreadCount && unreadCount > 0 && (
                                <span className="ml-auto text-xs font-semibold bg-gray-600 data-[selected=true]:bg-white data-[selected=true]:text-blue-900 text-gray-200 rounded-full px-2 py-0.5">
                                    {unreadCount}
                                </span>
                            )}
                        </Button>
                    );
                })}

                {/* Separator or Categories Expander Here */}
                <div className="pt-4 mt-4 border-t border-gray-700">
                    <h3 className="px-2 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Labels</h3>
                </div>

                {/* User Labels */}
                {isLoadingLabels && <p className="px-2 text-sm text-gray-400">Loading labels...</p>}
                {labelsError && <p className="px-2 text-sm text-red-400">Error: {labelsError}</p>}
                {!isLoadingLabels && userLabels.map((label) => (
                    <Button
                        key={label.id}
                        variant="ghost"
                        className="w-full justify-start text-gray-300 hover:bg-gray-700 hover:text-white group rounded-r-full rounded-l-none data-[selected=true]:bg-blue-800 data-[selected=true]:text-white"
                        onClick={() => onSelectLabel(label.id)}
                    >
                        <span
                            className="mr-4 h-3 w-3 rounded-sm inline-block border border-gray-500 flex-shrink-0"
                            style={{ backgroundColor: label.color?.backgroundColor || 'transparent' }}
                        ></span>
                        <span className="flex-1 truncate text-sm font-medium">{label.name}</span>
                        {label.messagesUnread && label.messagesUnread > 0 && (
                            <span className="ml-auto text-xs font-semibold bg-gray-600 text-gray-200 rounded-full px-2 py-0.5">
                                {label.messagesUnread}
                            </span>
                        )}
                    </Button>
                ))}
                {!isLoadingLabels && userLabels.length === 0 && !labelsError &&
                    <p className="px-2 text-sm text-gray-500">No user labels found.</p>}

                {/* Add Manage/Create Label Buttons */}
                <Button variant="ghost" className="w-full justify-start text-gray-400 hover:bg-gray-700 hover:text-white rounded-r-full rounded-l-none mt-2">
                    <Settings className="mr-4 h-5 w-5 flex-shrink-0" />
                    <span className="text-sm font-medium">Manage labels</span>
                </Button>
                <Button variant="ghost" className="w-full justify-start text-gray-400 hover:bg-gray-700 hover:text-white rounded-r-full rounded-l-none">
                    <PlusCircle className="mr-4 h-5 w-5 flex-shrink-0" />
                    <span className="text-sm font-medium">Create new label</span>
                </Button>

            </nav>
        </div>
    );
};

export default SidebarNav; 