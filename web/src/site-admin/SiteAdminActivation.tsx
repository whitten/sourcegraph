import H from 'history'
import CheckboxBlankCircleOutlineIcon from 'mdi-react/CheckboxBlankCircleOutlineIcon'
import CheckboxMarkedCircleOutlineIcon from 'mdi-react/CheckboxMarkedCircleOutlineIcon'
import InformationOutlineIcon from 'mdi-react/InformationOutlineIcon'
import RocketIcon from 'mdi-react/RocketIcon'
import CircularProgressbar from 'react-circular-progressbar'

import * as React from 'react'
import { Observable, Subscription } from 'rxjs'
import { map } from 'rxjs/operators'
import { Props as CommandListProps } from '../../../shared/src/commandPalette/CommandList'
import { PopoverButton } from '../../../shared/src/components/PopoverButton'
import { dataOrThrowErrors, gql } from '../../../shared/src/graphql/graphql'
import { queryGraphQL } from '../backend/graphql'

export interface SiteAdminChecklistInfo {
    connectedCodeHost: boolean
    enabledRepository: boolean
    enabledExtension: boolean
    enabledSignOn: boolean
}

/**
 * percentageDone returns the percent of activation checklist items completed.
 */
export const percentageDone = (info: SiteAdminChecklistInfo): number => {
    const vals = Object.values(info)
    return (100 * vals.filter(e => e).length) / vals.length
}

/**
 * fetchSiteAdminChecklist fetches the site admin activation checklist.
 */
export const fetchSiteAdminChecklist: () => Observable<SiteAdminChecklistInfo> = () =>
    queryGraphQL(gql`
        query {
            externalServices {
                totalCount
            }
            repositories(enabled: true) {
                totalCount
            }
            viewerSettings {
                final
            }
        }
    `).pipe(
        map(dataOrThrowErrors),
        map(data => {
            const settings = JSON.parse(data.viewerSettings.final)
            const authProviders = window.context.authProviders
            return {
                connectedCodeHost: data.externalServices.totalCount > 0,
                enabledRepository: data.repositories.totalCount !== null && data.repositories.totalCount > 0,
                enabledExtension:
                    settings.extensions && Object.values(settings.extensions).filter(enabled => enabled).length > 0,
                enabledSignOn: !!(authProviders && authProviders.filter(p => !p.isBuiltin).length > 0),
            }
        })
    )

type SiteAdminActivationPopoverButtonProps = CommandListProps & { history: H.History }
interface SiteAdminActivationPopoverButtonState {
    checklistInfo?: SiteAdminChecklistInfo
}

/**
 * SiteAdminActivationPopoverButton is the nav bar button that opens the site admin
 * activation checklist as a dropdown.
 */
export class SiteAdminActivationPopoverButton extends React.PureComponent<
    SiteAdminActivationPopoverButtonProps,
    SiteAdminActivationPopoverButtonState
> {
    private subscriptions = new Subscription()

    constructor(props: SiteAdminActivationPopoverButtonProps) {
        super(props)
        this.state = {
            checklistInfo: {
                connectedCodeHost: false,
                enabledRepository: false,
                enabledExtension: false,
                enabledSignOn: false,
            },
        }
    }

    public componentDidMount(): void {
        this.subscriptions.add(
            fetchSiteAdminChecklist().subscribe(checklistInfo => {
                this.setState({ checklistInfo })
            })
        )
    }

    public componentWillUnmount(): void {
        this.subscriptions.unsubscribe()
    }

    public render(): JSX.Element | null {
        const percentage = this.state.checklistInfo ? percentageDone(this.state.checklistInfo) : 0
        return (
            <PopoverButton
                className="onboarding-button"
                {...this.state}
                popoverClassName="rounded"
                placement="auto-end"
                hideOnChange={true}
                hideCaret={true}
                popoverElement={<SiteAdminActivationPopoverDropdown history={this.props.history} {...this.state} />}
            >
                <span className="link-like">Setup</span>
                <div className="progress-bar-container">
                    <CircularProgressbar strokeWidth={12} percentage={percentage} />
                </div>
            </PopoverButton>
        )
    }
}

/**
 * SiteAdminActivationPopoverDropdown presents the site admin activation checklist
 * in a navbar dropdown.
 */
export class SiteAdminActivationPopoverDropdown extends React.PureComponent<SiteAdminChecklistProps, {}> {
    public render(): JSX.Element {
        return (
            <div className="onboarding-container command-list list-group list-group-flush rounded">
                <div className="list-group-item">
                    <div className="header">
                        <h2>
                            <RocketIcon className="icon-inline" /> Hi there!
                        </h2>
                        <p>
                            This is the Sourcegraph Quick Start Guide. Complete the steps below to finish setting up
                            your Sourcegraph instance.
                        </p>
                    </div>
                </div>
                <div className="list-group-item">
                    <SiteAdminChecklist {...this.props} />
                </div>
            </div>
        )
    }
}

interface SiteAdminChecklistProps {
    history: H.History
    checklistInfo?: SiteAdminChecklistInfo
}

/**
 * SiteAdminChecklist renders the site admin activation checklist.
 */
export class SiteAdminChecklist extends React.PureComponent<SiteAdminChecklistProps, {}> {
    private addCodeHosts = () => {
        this.props.history.push('/site-admin/external-services')
    }
    private enableRepos = () => {
        this.props.history.push('/site-admin/repositories')
    }
    private enableExtension = () => {
        this.props.history.push('/extensions')
    }
    private enableSignOn = () => {
        window.open('https://docs.sourcegraph.com/admin/auth', '_blank')
    }

    public render(): JSX.Element {
        return (
            <div className="site-admin-checklist-container">
                {this.props.checklistInfo ? (
                    <ul className="site-admin-checklist">
                        <li>
                            <ChecklistItem
                                title="Connect your code host"
                                done={this.props.checklistInfo.connectedCodeHost}
                                action={this.addCodeHosts}
                                detail="Configure Sourcegraph to talk to your code host and fetch a list of your repositories."
                            />
                        </li>
                        <li>
                            <ChecklistItem
                                title="Enable repositories"
                                done={this.props.checklistInfo.enabledRepository}
                                action={this.enableRepos}
                                detail="Select which repositories Sourcegraph should pull and index from your code host(s)."
                            />
                        </li>
                        <li>
                            <ChecklistItem
                                title="Enable an extension"
                                done={this.props.checklistInfo.enabledExtension}
                                action={this.enableExtension}
                                detail="Enable a Sourcegraph extension to add jump-to-def, find-refs, or helpful annotations from 3rd party dev tools."
                            />
                        </li>
                        <li>
                            <ChecklistItem
                                title="Configure sign-up"
                                done={this.props.checklistInfo.enabledSignOn}
                                action={this.enableSignOn}
                                detail="Configure a single-sign on (SSO) provider or enable open sign-up so you can share Sourcegraph with others on your team."
                            />
                        </li>
                    </ul>
                ) : (
                    <div>Loading...</div>
                )}
            </div>
        )
    }
}

interface ChecklistItemProps {
    title: string
    action: () => void
    done?: boolean
    detail?: string
}

interface ChecklistItemState {
    showDetail?: boolean
}

/**
 * ChecklistItem is a single item in the site admin activation checklist.
 */
class ChecklistItem extends React.PureComponent<ChecklistItemProps, ChecklistItemState> {
    public state: ChecklistItemState = {}

    private toggleDetail = (e: React.MouseEvent<HTMLSpanElement>) => {
        e.stopPropagation()
        this.setState({ showDetail: !this.state.showDetail })
    }

    public render(): JSX.Element {
        return (
            <div className="item-container">
                <p className="item-title" onClick={this.props.action}>
                    {this.props.done ? (
                        <CheckboxMarkedCircleOutlineIcon className="icon-inline done" />
                    ) : (
                        <CheckboxBlankCircleOutlineIcon className="icon-inline todo" />
                    )}
                    &nbsp;&nbsp;
                    {this.props.title}
                    &nbsp;
                    <span className="info-button" onClick={this.toggleDetail}>
                        <InformationOutlineIcon className="icon-inline" />
                    </span>
                </p>
                <p className={'item-detail' + (this.state.showDetail ? ' show' : ' hide')}>{this.props.detail}</p>
            </div>
        )
    }
}
