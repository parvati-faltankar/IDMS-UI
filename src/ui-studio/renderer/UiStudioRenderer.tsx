import type { FC } from 'react';
import type { RuntimeContext, ViewMetadata } from '../types';
import { renderToModel } from './renderToModel';

export type UiStudioRendererProps = {
  context: RuntimeContext;
  view: ViewMetadata;
};

const UiStudioRenderer: FC<UiStudioRendererProps> = ({ context, view }) => {
  const { model } = renderToModel(view, context);

  return (
    <div data-testid="ui-studio-renderer" data-view-id={model.viewId}>
      {model.componentModels.map((component) => (
        <div key={component.id} data-component-id={component.id} hidden={component.hidden}>
          {component.label ?? component.type}
        </div>
      ))}
    </div>
  );
};

export default UiStudioRenderer;

