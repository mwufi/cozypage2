'use client';

import { DriveFile } from '@/app/drive/page'; // Adjust the import path as needed
import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"; // Path to your shadcn table component
import Image from 'next/image';

interface DriveFileListProps {
    files: DriveFile[];
}

// Helper function to format file size
function formatFileSize(sizeInBytes?: string): string {
    if (!sizeInBytes) return 'N/A';
    const size = parseInt(sizeInBytes, 10);
    if (isNaN(size)) return 'N/A';
    if (size === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(size) / Math.log(k));
    return parseFloat((size / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Helper function to format date
function formatDate(dateString: string): string {
    try {
        return new Date(dateString).toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    } catch (e) {
        return dateString; // Return original if formatting fails
    }
}

const DriveFileList: React.FC<DriveFileListProps> = ({ files }) => {
    if (!files || files.length === 0) {
        return <p className="text-center text-gray-500">No files to display.</p>;
    }

    return (
        <div className="overflow-x-auto rounded-lg border shadow-sm">
            <Table>
                <TableCaption className="py-4 text-sm text-gray-600">A list of your Google Drive files.</TableCaption>
                <TableHeader>
                    <TableRow className="bg-gray-50 hover:bg-gray-100 transition-colors">
                        <TableHead className="w-[50px] px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"></TableHead>
                        <TableHead className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</TableHead>
                        <TableHead className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</TableHead>
                        <TableHead className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Modified</TableHead>
                        <TableHead className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Size</TableHead>
                        <TableHead className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Owner(s)</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {files.map((file) => (
                        <TableRow key={file.id} className="hover:bg-gray-50 transition-colors border-b last:border-b-0">
                            <TableCell className="px-3 py-3 whitespace-nowrap">
                                {file.iconLink && (
                                    <Image src={file.iconLink} alt="File icon" width={20} height={20} className="min-w-[20px]" />
                                )}
                            </TableCell>
                            <TableCell className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                                <a
                                    href={file.alternateLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:text-blue-800 hover:underline"
                                >
                                    {file.title}
                                </a>
                            </TableCell>
                            <TableCell className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{file.mimeType}</TableCell>
                            <TableCell className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{formatDate(file.modifiedDate)}</TableCell>
                            <TableCell className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{formatFileSize(file.fileSize)}</TableCell>
                            <TableCell className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{file.ownerNames?.join(', ') || 'N/A'}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
};

export default DriveFileList; 