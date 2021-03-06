
import React from 'react'
import { actionMixin, fetch, navigate, createAppElement, getComponent, getAction } from 'maka'
import initState from './state'
var eventListeners = {}

const getNoticeData = (notices) => {
    const Tag = getComponent('antd.Tag'),
        moment = getAction('moment'),
        lodash = getAction('lodash')
    if (notices.length === 0) {
        return {};
    }
    const newNotices = notices.map(notice => {

        const newNotice = { ...notice };
        if (newNotice.datetime) {
            newNotice.datetime = moment(notice.datetime).fromNow();
        }
        if (newNotice.id) {
            newNotice.key = newNotice.id;
        }
        if (newNotice.extra && newNotice.status) {
            const color = {
                todo: '',
                processing: 'blue',
                urgent: 'red',
                doing: 'gold',
            }[newNotice.status];
            newNotice.extra = (
                <Tag color={color} style={{ marginRight: 0 }}>
                    {newNotice.extra}
                </Tag>
            );
        }
        return newNotice;
    });
    return lodash.groupBy(newNotices, 'type');
}

const getUnreadData = noticeData => {
    const unreadMsg = {};
    Object.entries(noticeData).forEach(([key, value]) => {
        if (!unreadMsg[key]) {
            unreadMsg[key] = 0;
        }
        if (Array.isArray(value)) {
            unreadMsg[key] = value.filter(item => !item.read).length;
        }
    });
    return unreadMsg;
}


@actionMixin('base', 'webapi', 'modal', 'lodash', 'moment', 'classnames', 'image', 'i18n')
export default class action {
    constructor(option) {
        Object.assign(this, option.mixins)
    }

    styles = (suffix) => `portal-${suffix}`

    onInit = () => {
        this.load()

        navigate.listen(this.listen)

        var local = navigate.getLocation()
        var target
        if (navigate.getLocation().pathname == '/portal') {
            target = '/portal/dashboard-analysis'
        }
        else {
            target = local.pathname + local.search
        }
        navigate.redirect(target)
    }

    load = async () => {
        var menus = await this.webapi.portal.getMenu()
        var setting = await this.webapi.option.query()
        var notices = await this.webapi.notice.query()
        notices = getNoticeData(notices)

        //menus = initState.data.menu.concat(menus)
        this.base.setState({
            'data.menu': menus,
            'data.setting': setting,
            'data.notices': {
                value: notices,
                unread: getUnreadData(notices)
            }
        })
    }

    reload = async () => {
        var menus = await this.webapi.portal.getMenu()
        var setting = await this.webapi.option.query()
        menus = initState.data.menu.concat(menus)
        var oriLayout = this.base.gs('data.setting.layout')
        this.base.setState({
            'data.menu': menus,
            'data.setting.theme': setting.theme,
            'data.setting.fixedHeader': setting.fixedHeader,
            'data.setting.fixedSiderbar': setting.fixedSiderbar,
            'data.setting.horizontalMenu': setting.horizontalMenu,
            'data.setting.tabStyle': setting.tabStyle,
            'data.setting.layout': setting.layout,
            'data.setting.contentWidth': setting.contentWidth
        })
        if (oriLayout !== setting.layout)
            this.fireResize()

    }

    fireResize = () => {
        setTimeout(() => {
            if (document.createEvent) {
                var event = document.createEvent("HTMLEvents");
                event.initEvent("resize", true, true);
                window.dispatchEvent(event);
            } else if (document.createEventObject) {
                window.fireEvent("onresize");
            }
        })
    }

    getCurrentUser = () => this.base.context.get('currentUser') || {}

    getMenuChildren = () => {
        const menu = this.base.gs('data.menu')

        const loop = (children, level) => {
            const ret = []
            children.forEach(child => {
                let ele = {
                    name: child.appName,
                    key: child.appName
                }

                if (child.isGroup) {
                    ele.component = 'antd.Menu.ItemGroup'
                    ele.title = this.i18n(child.locale) || child.title//child.title
                    if (child.children) {
                        ele.children = loop(child.children, level + 1)
                    }
                }
                else {
                    if (!child.children) {
                        ele.component = 'antd.Menu.Item'

                        if (child.icon || level == 1) {
                            ele.children = [{
                                component: 'antd.Icon',
                                type: child.icon || 'desktop',
                                className: 'anticon'
                            }, {
                                name: 'name',
                                component: 'span',
                                children: this.i18n(child.locale) || child.title//child.title
                            }]
                        }
                        else {
                            ele.children = this.i18n(child.locale) || child.title//child.title
                        }
                    }
                    else {
                        ele.component = 'antd.Menu.SubMenu'
                        ele.children = loop(child.children, level + 1)

                        if (child.icon || level == 1) {
                            ele.title = [{
                                component: 'antd.Icon',
                                className: 'anticon',
                                type: child.icon || 'desktop'
                            }, {
                                component: 'span',
                                children: this.i18n(child.locale) || child.title//child.title
                            }]
                        }
                        else {
                            ele.title = this.i18n(child.locale) || child.title//child.title
                        }
                    }
                }

                if (!(child.isVisible === false))
                    ret.push(ele)
            })
            return ret
        }
        return {
            _isMeta: true,
            value: loop(menu, 1)
        }

    }

    topMenuClick = async (e) => {
        switch (e.key) {
            case 'logout':
                this.base.context.set('currentUser', undefined)
                fetch.clearAccessToken()
                navigate.redirect('/sign-in')
                break;
            case 'userCenter':
                this.setContent('', 'account-center')
                break;
            case 'userSetting':
                this.setContent('', 'account-setting')
                break;
            case 'devtool':
                this.modal.show({
                    title: this.i18n('menu-devtool'),
                    children: createAppElement("devtools", {
                        onPortalReload: this.reload
                    }),
                    bodyStyle: {
                        height: 450
                    },
                    width: 1100,
                })
                break;
            case 'appstore':
                this.modal.show({
                    title: this.i18n('menu-appstore'),
                    children: createAppElement("app-store", {
                        onPortalReload: this.reload
                    }),
                    bodyStyle: {
                        height: 450
                    },
                    width: 1100,
                })
                break;
            // case 'toggleTabs':
            //    this.base.ss({ 'data.isTabsStyle': !this.base.gs('data.isTabsStyle') })
        }
    }


    menuClick = (e) => {
        const hit = this.findMenu(this.base.gs('data.menu'), e.key)

        if (hit) {
            if (hit.isModal) {
                this.modal.show({
                    title: '开发工具',
                    children: createAppElement(hit.appName, {
                    }),
                    ...hit
                })
            }
            else {
                this.setContent(hit.locale, hit.appName, hit.appProps, hit.alwaysRender)
            }
        }
    }

    menuOpenChange = (openKeys) => {
        var menuOpenKeys = []
        if (openKeys && openKeys.length > 0) {
            let key = openKeys[openKeys.length - 1]
            if (key.indexOf('-') != -1){
                if (openKeys.length > 1) {
                    menuOpenKeys.push(key.split('-')[0])
                    menuOpenKeys.push(key)
                }
                else {
                    menuOpenKeys = []
                }
            }
            else{
                menuOpenKeys.push(key)
            }

        }
        this.base.ss({
            'data.menuOpenKeys': menuOpenKeys
        })
    }

    getMenuSelectKeys = () => {
        const content = this.base.gs('data.content')
        if (!content) return
        var menu = this.findMenu(this.base.gs('data.menu'), content.appName)
        return menu ? [menu.appName] : []
    }

    tabChange = (key) => {
        const openTabs = this.base.gs('data.openTabs')
        const curr = openTabs.find(o => o.appName == key)
        this.setContent(curr.title, curr.appName, curr.appProps, curr.alwaysRender)
    }

    tabEdit = async (key, action) => {
        if (action == 'remove') {
            //页签关闭调用app监听方法
            var closeListener = eventListeners[`${key}__close`]
            if (closeListener && !(await closeListener())) {
                return
            }
            var openTabs = this.base.gs('data.openTabs') || []
            var hitIndex = openTabs.findIndex(o => o.appName == key)

            openTabs.splice(hitIndex, 1)

            var content = openTabs.length > 0 ? openTabs[openTabs.length - 1] : {}

            //页签激活调用app监听方法
            var activeListener = eventListeners[`${content.appName}__active`]
            if (activeListener) {
                setTimeout(activeListener, 16)
            }

            var json = {
                'data.openTabs': openTabs,
                'data.content': content
            }
            this.base.setState(json)
        }
    }

    findMenu = (menu, appName) => {
        const loop = (children) => {
            var ret
            for (var child of children) {
                if (child.appName == appName) {
                    ret = child
                    break
                }

                if (child.children) {
                    ret = loop(child.children)
                    if (ret)
                        break
                }
            }
            return ret
        }
        return loop(menu)
    }

    foldMenu = () => {
        this.base.ss({ 'data.isFoldMenu': !this.base.gs('data.isFoldMenu') })
    }

    setContent = (title, appName, appProps, alwaysRender) => {
        if (!appName)
            return

        var data = this.base.getState('data'),
            menu = data.menu,
            openTabs = data.openTabs || [],
            isTabsStyle = data.setting.tabStyle,
            oriMenuItem = this.findMenu(menu, appName),
            json = {}

        const currContent = data.content
        if (currContent && appName == currContent.appName)
            return

        title = title || (oriMenuItem && oriMenuItem.title)
        appProps = appProps || (oriMenuItem && oriMenuItem.appProps) || {}

        var content = { title, appName, appProps, alwaysRender }

        json['data.content'] = content

        var hitIndex = openTabs.findIndex(o => (o.title == title && title) || o.appName == appName)
        var hit = hitIndex != -1

        if (!hit) {
            if (!isTabsStyle)
                openTabs = []
            openTabs.push(content)

            json['data.openTabs'] = openTabs
        }
        else {
            if (isTabsStyle) {
                //页签激活调用app监听方法
                var activeListener = eventListeners[`${content.appName}__active`]
                if (activeListener) {
                    setTimeout(activeListener, 16)
                }

                json['data.openTabs.' + hitIndex] = content
            }
            else {
                openTabs = []
                openTabs.push(content)
                json['data.openTabs'] = openTabs
            }
        }

        this.base.setState(json)

        setTimeout(() => {
            let location = navigate.getLocation()
            let full = `${location.pathname}${location.search}`
            let segs = full.split('/')
            segs = segs.slice(0, segs.indexOf('portal') + 1)
            segs.push(content.appName)
            navigate.redirect(segs.join('/'))
        }, 0)
    }

    openOption = () => {
        this.base.setState({ 'data.optionVisible': !this.base.getState('data.optionVisible') })
    }


    addTabCloseListener = (appFullName, handler) => {
        eventListeners[appFullName + '__close'] = handler
    }

    removeTabCloseListener = (appFullName) => {
        if (eventListeners[appFullName + '__close'])
            delete eventListeners[appFullName + '__close']
    }

    addTabActiveListener = (appFullName, handler) => {
        eventListeners[appFullName + '__active'] = handler
    }

    removeTabActiveListener = (appFullName) => {
        if (eventListeners[appFullName + '__active'])
            delete eventListeners[appFullName + '__active']
    }

    listen = (location, action) => {
        let full = `${location.pathname}${location.search}`
        if (!full || full.indexOf('portal') == -1)
            return

        let segs = full.split('/'),
            targetApp = segs[segs.length - 1]

        if (targetApp == 'portal' || !targetApp) {
            this.base.ss({
                'data.openTabs': [],
                'data.content': {}
            })
        }
        else {
            this.setContent('', targetApp)
        }
    }

    componentWillUnmount = () => {
        navigate.unlisten(this.listen)
    }


    getLayoutStyle = (isMobile) => {
        const setting = this.base.gs('data.setting')
        const { fixedSiderbar, collapsed, layout } = setting
        if (fixedSiderbar && layout !== 'topmenu' && !isMobile) {
            return {
                paddingLeft: (collapsed || isMobile) ? '80px' : '256px',
                minHeight: '100vh',
            };
        }
        return { minHeight: '100vh' };
    }

    getHeadWidth = (isMobile) => {
        const { collapsed, fixedHeader, layout } = this.base.gs('data.setting')
        if (isMobile || !fixedHeader || layout === 'topmenu') {
            return '100%';
        }
        return collapsed ? 'calc(100% - 80px)' : 'calc(100% - 256px)';
    }

    onCollapse = (collapsed) => {
        if (collapsed === true) {
            this.base.ss({
                'data.menuOpenKeys': [],
                'data.setting.collapsed': collapsed
            })
        }
        else {
            this.base.ss({ 'data.setting.collapsed': collapsed })
        }

    }

    drawerVisible = (visible) => {
        this.base.ss({ 'data.setting.drawerVisible': visible })
    }

    clearNotice = (tabName) => {
        this.base.ss({
            [`data.notices.value.${tabName}`]: [],
            [`data.notices.unread.${tabName}`]: 0
        })
    }
}

