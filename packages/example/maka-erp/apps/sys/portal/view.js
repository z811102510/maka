export default {
    component: 'div',
    className: 'portal',
    children: [{
        component: 'div',
        className: 'portal-header',
        children: [{
            component: 'div',
            className: "{{'portal-header-left portal-header-left-' + (data.isFoldMenu?'fold':'unfold') }}",
            children: [{
                component: 'img',
                className: 'portal-header-left-logo',
                src: 'logo.png'
            }, {
                component: 'span',
                className: 'portal-header-left-caption',
                children: 'Application',
                _visible: '{{!data.isFoldMenu}}',
            }]
        }, {
            component: 'div',
            className: "portal-header-center",

        }, {
            component: 'div',
            className: "portal-header-right",
            children: [{
                component: 'antd.Popover',
                placement: 'bottomRight',
                children: {
                    component: 'div',
                    className: "portal-header-right-search",
                    children: {
                        component: 'antd.Icon',
                        type: 'search'
                    },
                },
                content: {
                    component: 'antd.Input.Search'
                }
            }, {
                component: 'antd.Popover',
                placement: 'bottomRight',
                autoAdjustOverflow: true,
                overlayStyle: { width: 300 },
                children: {
                    component: 'div',
                    className: "portal-header-right-search",
                    children: {
                        component: 'antd.Badge',
                        count: 5,
                        offset: [0, 2],
                        children: {
                            component: 'antd.Icon',
                            size: 'large',
                            type: 'bell'
                        }
                    },
                },
                content: {
                    component: 'AppLoader',
                    appName: 'portal-notice'
                }
            }, {
                component: 'div',
                className: "portal-header-right-topMenu",
                children: [{
                    component: 'antd.Menu',
                    className: "portal-header-right-topMenu",
                    mode: 'horizontal',
                    onClick: '{{$topMenuClick}}',
                    selectedKeys: [],
                    children: [{
                        component: 'antd.Menu.Item',
                        key: 'toggleTabs',
                        _visible: false,
                        children: [{
                            component: 'antd.Icon',
                            type: 'appstore-o'
                        },
                            "{{data.isTabsStyle ? 'Normal' : 'Tabs'}}"]
                    }, {
                        component: 'antd.Menu.SubMenu',
                        key: 'my',
                        title: {
                            component: 'span',
                            className: 'portal-header-right-my-title',
                            children: [{
                                component: 'img',
                                className: 'portal-header-right-photo',
                                src: 'photo.png'
                            }, "{{data.other.currentUser?data.other.currentUser.name:'13334445556'}}"]
                        },
                        children: [{
                            component: 'antd.Menu.Item',
                            key: 'mySetting',
                            children: 'My setting'
                        }, {
                            component: 'antd.Menu.Item',
                            key: 'logout',
                            children: 'Sign out'
                        }]
                    }]
                }]
            }]
        }]
    }, {
        component: 'div',
        className: 'portal-content',
        children: [{
            component: 'div',
            className: "{{'portal-content-left portal-content-left-' + (data.isFoldMenu?'fold':'unfold') }}",
            style: "{{({overflow:data.isFoldMenu?'visible':'auto'})}}",
            children: [{
                component: 'antd.Menu',
                mode: 'vertical',
                theme: 'dark',
                className: 'portal-content-left-menu',
                inlineCollapsed: '{{data.isFoldMenu}}',
                selectedKeys: "{{$getMenuSelectKeys()}}",
                defaultOpenKeys: "{{data.menuDefaultOpenKeys}}",
                onClick: '{{$menuClick}}',
                getPopupContainer: () => { return document.querySelector('.portal-content-left-menu') },
                children: '{{$getMenuChildren()}}'
            }, {
                component: 'div',
                className: 'portal-content-left-foldMenu',
                children: [{
                    component: 'antd.Icon',
                    type: `{{data.isFoldMenu ? 'double-right' :'double-left'}}`,
                    title: `{{data.isFoldMenu ? 'Open' :'Close'}}`,
                    style: { fontSize: 19 },
                    onClick: '{{$foldMenu}}'
                }]
            }]
        }, {
            component: 'div',
            className: 'portal-content-main',
            _visible: '{{!!(data.content && data.content.appName)}}',
            children: [{
                component: 'div',
                className: "portal-content-main-tabs",
                children: {
                    component: 'antd.Tabs',
                    type: "editable-card",
                    hideAdd: true,
                    activeKey: '{{data.content && data.content.appName}}',
                    onChange: '{{$tabChange}}',
                    onEdit: '{{$tabEdit}}',
                    children: [{
                        _for: 'item in data.openTabs',
                        component: 'antd.Tabs.TabPane',
                        key: `{{item.appName}}`,
                        tab: '{{item.title}}'
                    }],
                    _visible: '{{ data.isTabsStyle && data.openTabs && data.openTabs.length > 0}}',
                }
            }, {
                component: 'div',
                className: "portal-content-main-app",
                children: {
                    _for: 'item in data.openTabs',
                    component: 'AppLoader',
                    appName: '{{item && item.appName }}',
                    onPortalReload: '{{{console.log(item) ; return $load}}}',
                    setPortalContent: '{{$setContent}}',
                    '...': '{{item && item.appProps}}',
                    isTabStyle: '{{data.isTabsStyle}}',
                    _notRender: '{{ !(data.content && data.content.appName == item.appName) }}'
                }
            }]

        }]
    }]
}