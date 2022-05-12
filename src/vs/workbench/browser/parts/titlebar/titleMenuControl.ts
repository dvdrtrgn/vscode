/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ToolBar } from 'vs/base/browser/ui/toolbar/toolbar';
import { IAction } from 'vs/base/common/actions';
import { Codicon } from 'vs/base/common/codicons';
import { DisposableStore } from 'vs/base/common/lifecycle';
import { localize } from 'vs/nls';
import { createActionViewItem, createAndFillInContextMenuActions, MenuEntryActionViewItem } from 'vs/platform/actions/browser/menuEntryActionViewItem';
import { IMenuService, MenuId, MenuItemAction, MenuRegistry } from 'vs/platform/actions/common/actions';
import { IContextKeyService } from 'vs/platform/contextkey/common/contextkey';
import { IContextMenuService } from 'vs/platform/contextview/browser/contextView';
import { IInstantiationService } from 'vs/platform/instantiation/common/instantiation';
import { IQuickInputService } from 'vs/platform/quickinput/common/quickInput';
import { WindowTitle } from 'vs/workbench/browser/parts/titlebar/windowTitle';

export class TitleMenuControl {

	private readonly _disposables = new DisposableStore();

	readonly element: HTMLElement = document.createElement('div');

	constructor(
		windowTitle: WindowTitle,
		@IContextMenuService contextMenuService: IContextMenuService,
		@IContextKeyService contextKeyService: IContextKeyService,
		@IInstantiationService instantiationService: IInstantiationService,
		@IMenuService menuService: IMenuService,
		@IQuickInputService quickInputService: IQuickInputService,
	) {
		this.element.classList.add('title-menu');
		const titleToolbar = new ToolBar(this.element, contextMenuService, {
			actionViewItemProvider: (action) => {

				if (action instanceof MenuItemAction && action.id === 'workbench.action.quickOpen') {

					class InputLikeViewItem extends MenuEntryActionViewItem {
						override render(container: HTMLElement): void {
							super.render(container);
							container.classList.add('quickopen');
							this._store.add(windowTitle.onDidChange(this._updateFromWindowTitle, this));
							this._updateFromWindowTitle();
						}
						private _updateFromWindowTitle() {
							if (this.label) {
								this.label.innerText = localize('search', "Search {0}", windowTitle.workspaceName);
								this.label.title = windowTitle.value;
							}
						}
					}
					return instantiationService.createInstance(InputLikeViewItem, action, undefined);
				}

				return createActionViewItem(instantiationService, action);
			}
		});
		const titleMenu = this._disposables.add(menuService.createMenu(MenuId.TitleMenu, contextKeyService));
		const titleMenuDisposables = this._disposables.add(new DisposableStore());
		const updateTitleMenu = () => {
			titleMenuDisposables.clear();
			const actions: IAction[] = [];
			titleMenuDisposables.add(createAndFillInContextMenuActions(titleMenu, undefined, actions));
			titleToolbar.setActions(actions);
		};
		updateTitleMenu();
		this._disposables.add(titleMenu.onDidChange(updateTitleMenu));
		this._disposables.add(quickInputService.onShow(() => this.element.classList.toggle('hide', true)));
		this._disposables.add(quickInputService.onHide(() => this.element.classList.toggle('hide', false)));
	}

	dispose(): void {
		this._disposables.dispose();
	}
}

MenuRegistry.appendMenuItem(MenuId.TitleMenu, {
	submenu: MenuId.TitleMenuQuickPick,
	title: localize('title', "Quick Pick"),
	icon: Codicon.search,
	order: Number.MAX_SAFE_INTEGER
});
