type OnButtonClick = () => void;
type OnTabSwitch = (oldTabId: string, newTabId: string) => void;

export type Tab = {
	id: string,
	label: string,
	tooltip: string,
};

export type Button = {
	id: string,
	label: string,
	tooltip: string,
	onClick: OnButtonClick,
};

export type MenuItem = {
	id: string,
	label: string,
	onClick: OnButtonClick,
};

export class EditorBar {
	title: string;

	tabs: Array<Tab>;

	buttons: Array<Button>;

	menu: Array<MenuItem>;

	activeTabId: string;

	onTabSwitch: OnTabSwitch;

	dom: HTMLElement;

	domTitle: HTMLParagraphElement;

	domTabs: { [key: string]: HTMLButtonElement };

	btnTimer: NodeJS.Timeout;

	constructor(
		title: string,
		tabs: Array<Tab>,
		buttons: Array<Button>,
		menu: Array<MenuItem>,
		activeTabId?: string,
	) {
		this.title = title;
		this.tabs = tabs;
		this.buttons = buttons;
		this.menu = menu;
		this.activeTabId = activeTabId || this.tabs[0].id;

		// eslint-disable-next-line @typescript-eslint/no-empty-function
		this.onTabSwitch = () => {};
		this.domTabs = {};
	}

	build(domContainer: HTMLElement) {
		this.dom = document.createElement('div');
		this.dom.id = 'jaffle-editor-bar';

		this.buildTitle();
		this.tabs.forEach((tab) => this.buildTab(tab));
		this.buildMenu();
		this.buttons.reverse().forEach((button) => this.buildButton(button));
		domContainer.appendChild(this.dom);
	}

	setTitle(title: string): void {
		this.title = title;
		this.domTitle.innerText = title;
	}

	private switchTab(newActiveTabId: string): void {
		this.domTabs[this.activeTabId].classList.remove('jaffle-tab-active');
		this.domTabs[newActiveTabId].classList.add('jaffle-tab-active');
		this.onTabSwitch(this.activeTabId, newActiveTabId);
		this.activeTabId = newActiveTabId;
	}

	private buildTitle(): void {
		this.domTitle = document.createElement('p');
		this.domTitle.id = 'jaffle-title';
		this.domTitle.innerText = this.title;

		this.dom.appendChild(this.domTitle);
	}

	private buildTab(tab: Tab): void {
		const domTab = document.createElement('button');

		domTab.id = `jaffle-tab-${tab.id}`;
		domTab.classList.add('jaffle-tab');
		if (tab.id === this.activeTabId) {
			domTab.classList.add('jaffle-tab-active');
		}

		domTab.title = tab.tooltip;
		domTab.innerText = tab.label;
		domTab.addEventListener('click', () => {
			if (tab.id !== this.activeTabId) {
				this.switchTab(tab.id);
			}
		});

		this.domTabs[tab.id] = domTab;
		this.dom.appendChild(domTab);
	}

	private buildMenu(): void {
		const onMouseOut = (dom: HTMLElement) => {
			this.btnTimer = setTimeout(() => {
				// eslint-disable-next-line no-param-reassign
				dom.style.display = 'none';
			}, 200);
		};

		const domMenu = document.createElement('div');
		domMenu.id = 'jaffle-menu';
		domMenu.addEventListener('mouseover', () => clearTimeout(this.btnTimer));
		domMenu.addEventListener('mouseout', () => onMouseOut(domMenu));
		this.menu.forEach((item) => domMenu.appendChild(EditorBar.buildMenuItem(item)));
		this.dom.appendChild(domMenu);

		const domButton = document.createElement('button');
		domButton.id = 'jaffle-menu-btn';
		domButton.className = 'jaffle-btn';
		domButton.innerText = '≡';
		domButton.addEventListener('mouseover', () => {
			clearTimeout(this.btnTimer);
			domMenu.style.display = 'block';
		});
		domButton.addEventListener('mouseout', () => onMouseOut(domMenu));
		this.dom.appendChild(domButton);
	}

	private static buildMenuItem(item: MenuItem): HTMLParagraphElement {
		const domMenuItem = document.createElement('p');
		domMenuItem.id = `jaffle-menu-item-${item.id}`;
		domMenuItem.className = 'jaffle-menu-item';
		domMenuItem.innerText = item.label;
		domMenuItem.addEventListener('click', item.onClick);
		return domMenuItem;
	}

	private buildButton(button: Button): void {
		const domButton = document.createElement('button');

		domButton.id = `jaffle-btn-${button.id}`;
		domButton.className = 'jaffle-btn';
		domButton.title = button.tooltip;
		domButton.innerText = button.label;
		domButton.addEventListener('click', button.onClick);

		this.dom.appendChild(domButton);
	}

	static getStyle(): CSSStyleSheet {
		const style = new CSSStyleSheet();
		style.replaceSync(`		
			#jaffle-editor-bar {
				position: absolute;
				width: 100%;
				top: 0px;
				background-color: #0A813F;
				z-index: 6;
				height: 35px;
			}
	
			#jaffle-title {
				position: absolute;
				text-align: center;
				color: darkseagreen;
				left: 45%;
				width: 10%;
				margin-top: 9px;
				font-weight: bold;
				z-index: 0;
			}

			#jaffle-menu-btn {
				font-size: 22px;
				width: 1.8em;
			}

			#jaffle-menu {
				display: none;
				position: absolute;
				right: 0px;
				top: 35px;
				background-color: darkseagreen;
			}

			.jaffle-menu-item {
				margin: 0;
				padding: 5px;
				text-align: right;
				border-top: 3px solid #002b36;
				cursor: pointer;
			}

			.jaffle-menu-item:hover {
				background-color: cadetblue;
			}

			.jaffle-tab {
				margin: 0;
				margin-right: 5px;
				cursor: pointer;
				width: 4em;
				height: 35px;
				float: left;
				background-color: transparent;
				border: none;
				color: white;
				text-shadow: 1px 1px 2px black;
				font-weight: bold;
			}

			.jaffle-tab-active {
				background-color: #002b36 !important;
				cursor: default;
			}

			.jaffle-tab:hover {
				background-color: cadetblue;
			}

			.jaffle-btn {
				margin: 0;
				margin-left: 5px;
				cursor: pointer;
				width: 4em;
				height: 35px;
				float: right;
				background-color: darkseagreen;
				border: none;
				color: white;
				text-shadow: 1px 1px 2px black;
				font-weight: bold;
			}
	
			.jaffle-btn:hover {
				background-color: cadetblue;
			}`);
		return style;
	}
}

export default EditorBar;
