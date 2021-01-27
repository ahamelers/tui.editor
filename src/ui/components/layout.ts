import { EditorType, PreviewStyle } from '@t/editor';
import { Emitter } from '@t/event';
import { IndexList, ToolbarItem, ToolbarItemOptions } from '@t/ui';
import html from '../vdom/template';
import { Component } from '../vdom/component';
import { Switch } from './switch';
import { Toolbar } from './toolbar/toolbar';
import { ContextMenu } from './contextMenu';

interface Props {
  eventEmitter: Emitter;
  hideModeSwitch: boolean;
  slots: {
    mdEditor: HTMLElement;
    mdPreview: HTMLElement;
    wwEditor: HTMLElement;
  };
  previewStyle: PreviewStyle;
  editorType: EditorType;
  toolbarItems: ToolbarItem[];
}

interface State {
  editorType: EditorType;
  previewStyle: PreviewStyle;
  hide: boolean;
}
// @TODO: arrange class prefix
export class Layout extends Component<Props, State> {
  private toolbar!: Toolbar;

  constructor(props: Props) {
    super(props);
    const { editorType, previewStyle } = props;

    this.state = {
      editorType,
      previewStyle,
      hide: false,
    };
    this.addEvent();
  }

  mounted() {
    const { wwEditor, mdEditor, mdPreview } = this.props.slots;

    this.refs.wwContainer.appendChild(wwEditor);
    this.refs.mdContainer.insertAdjacentElement('afterbegin', mdEditor);
    this.refs.mdContainer.appendChild(mdPreview);
  }

  insertToolbarItem(indexList: IndexList, item: string | ToolbarItemOptions) {
    this.toolbar.insertToolbarItem(indexList, item);
  }

  removeToolbarItem(name: string) {
    this.toolbar.removeToolbarItem(name);
  }

  render() {
    const { eventEmitter, hideModeSwitch, toolbarItems } = this.props;
    const { hide, previewStyle, editorType } = this.state;
    const displayClassName = hide ? ' te-hide' : '';
    const editorTypeClassName = editorType === 'markdown' ? 'te-md-mode' : 'te-ww-mode';
    const previewClassName = `te-preview-style-${previewStyle === 'vertical' ? 'vertical' : 'tab'}`;

    return html`
      <div
        class="tui-editor-defaultUI${displayClassName}"
        ref=${(el: HTMLElement) => (this.refs.el = el)}
      >
        <${Toolbar}
          ref=${(toolbar: Toolbar) => (this.toolbar = toolbar)}
          eventEmitter=${eventEmitter}
          previewStyle=${previewStyle}
          toolbarItems=${toolbarItems}
          editorType=${editorType}
        />
        <div class="te-editor-section" ref=${(el: HTMLElement) => (this.refs.editorSection = el)}>
          <div class="tui-editor ${editorTypeClassName}">
            <div
              class="te-md-container ${previewClassName}"
              ref=${(el: HTMLElement) => (this.refs.mdContainer = el)}
            >
              <div class="te-md-splitter"></div>
            </div>
            <div class="te-ww-container" ref=${(el: HTMLElement) => (this.refs.wwContainer = el)} />
          </div>
        </div>
        ${!hideModeSwitch &&
        html`<${Switch} eventEmitter=${eventEmitter} editorType=${editorType} />`}
        <${ContextMenu} eventEmitter=${eventEmitter} />
      </div>
    `;
  }

  addEvent() {
    const { eventEmitter } = this.props;

    eventEmitter.listen('hide', this.hide);
    eventEmitter.listen('show', this.show);
    eventEmitter.listen('changeMode', this.changeMode);
    eventEmitter.listen('changePreviewStyle', this.changePreviewStyle);
  }

  private changeMode = (editorType: EditorType) => {
    if (editorType !== this.state.editorType) {
      this.setState({ editorType });
    }
  };

  private changePreviewStyle = (previewStyle: PreviewStyle) => {
    if (previewStyle !== this.state.previewStyle) {
      this.setState({ previewStyle });
    }
  };

  private hide = () => {
    this.setState({ hide: true });
  };

  private show = () => {
    this.setState({ hide: false });
  };
}
