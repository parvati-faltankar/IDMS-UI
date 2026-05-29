import { LayoutGrid, FileText, List } from 'lucide-react';

type StarterTemplate = 'blank' | 'create-edit' | 'list-view';

type EmptyCanvasStateProps = {
  onSelectTemplate: (template: StarterTemplate) => void;
};

const templates = [
  {
    id: 'blank' as StarterTemplate,
    icon: <LayoutGrid size={22} />,
    label: 'Blank Form',
    description: 'Start from scratch with an empty canvas',
  },
  {
    id: 'create-edit' as StarterTemplate,
    icon: <FileText size={22} />,
    label: 'Create / Edit Form',
    description: 'Header fields + line-item grid layout',
  },
  {
    id: 'list-view' as StarterTemplate,
    icon: <List size={22} />,
    label: 'List View',
    description: 'Data table with filters and actions',
  },
];

export default function EmptyCanvasState({ onSelectTemplate }: EmptyCanvasStateProps) {
  return (
    <div className="empty-canvas">
      <div className="empty-canvas__icon">
        <LayoutGrid size={36} />
      </div>
      <h3 className="empty-canvas__title">Start building your view</h3>
      <p className="empty-canvas__subtitle">
        Drag a component from the palette, or pick a starter template below.
      </p>
      <div className="empty-canvas__templates">
        {templates.map((tpl) => (
          <button
            key={tpl.id}
            type="button"
            className="template-card"
            onClick={() => onSelectTemplate(tpl.id)}
          >
            <span className="template-card__icon">{tpl.icon}</span>
            <span className="template-card__label">{tpl.label}</span>
            <span className="template-card__desc">{tpl.description}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
