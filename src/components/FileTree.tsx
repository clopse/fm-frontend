import { ChevronRight, ChevronDown, Folder, FolderOpen, FileText } from 'lucide-react';
import { FileNode, extractMetadata } from '@/lib/types';

interface FileTreeProps {
  node: FileNode;
  selectedFiles: string[];
  expandedFolders: Set<string>;
  onSelectFile: (path: string) => void;
  onToggleFolder: (path: string) => void;
  level?: number;
}

export default function FileTree({
  node,
  selectedFiles,
  expandedFolders,
  onSelectFile,
  onToggleFolder,
  level = 0
}: FileTreeProps) {
  const isExpanded = expandedFolders.has(node.path);
  const isSelected = selectedFiles.includes(node.path);
  
  if (node.type === 'file') {
    const metadata = extractMetadata(node.name);
    
    return (
      <button
        onClick={() => onSelectFile(node.path)}
        className={`w-full flex items-center space-x-2 px-2 py-2 rounded-lg text-sm transition-all group ${
          isSelected
            ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
            : 'text-slate-300 hover:bg-slate-800/50'
        }`}
        style={{ paddingLeft: `${level * 12 + 8}px` }}
        title={node.name}
      >
        <FileText className={`w-4 h-4 flex-shrink-0 ${
          isSelected ? 'text-white' : 'text-blue-400'
        }`} />
        <span className={`flex-1 text-left truncate font-mono text-xs ${
          isSelected ? 'font-semibold' : ''
        }`}>
          {node.name}
        </span>
        {metadata.revision && (
          <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono flex-shrink-0 ${
            isSelected 
              ? 'bg-white/20 text-white' 
              : 'bg-slate-700 text-slate-400'
          }`}>
            Rev.{metadata.revision}
          </span>
        )}
      </button>
    );
  }

  // Folder node
  return (
    <div>
      <button
        onClick={() => onToggleFolder(node.path)}
        className="w-full flex items-center space-x-2 px-2 py-2 rounded-lg text-sm transition-all hover:bg-slate-800/50 group"
        style={{ paddingLeft: `${level * 12 + 8}px` }}
      >
        {isExpanded ? (
          <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />
        ) : (
          <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0" />
        )}
        {isExpanded ? (
          <FolderOpen className="w-4 h-4 text-yellow-500 flex-shrink-0" />
        ) : (
          <Folder className="w-4 h-4 text-yellow-600 flex-shrink-0" />
        )}
        <span className="flex-1 text-left text-slate-200 font-medium truncate">
          {node.name}
        </span>
        {node.children && (
          <span className="text-[10px] text-slate-500 font-mono flex-shrink-0">
            {node.children.length}
          </span>
        )}
      </button>
      
      {isExpanded && node.children && (
        <div className="mt-0.5">
          {node.children.map((child) => (
            <FileTree
              key={child.path}
              node={child}
              selectedFiles={selectedFiles}
              expandedFolders={expandedFolders}
              onSelectFile={onSelectFile}
              onToggleFolder={onToggleFolder}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}
