import { Component, OnInit, Input, OnChanges, SimpleChanges, ViewChild, ElementRef, Optional } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MessageService } from 'primeng/api';
import { DynamicDialogRef, DynamicDialogConfig } from 'primeng/dynamicdialog';
import { PrimeNgModules } from '../../../../../primeng.modules';
import { NgxGraphModule } from '@swimlane/ngx-graph';

import { EnumerationAreaDataService } from '../../../../../core/dataservice/location/enumeration-area/enumeration-area.dataservice';
import {
	EaHistoryResponse,
	EaLineageNode,
	OperationType,
	EnumerationArea,
} from '../../../../../core/dataservice/location/enumeration-area/enumeration-area.dto';

@Component({
	selector: 'app-ea-history-viewer',
	templateUrl: './ea-history-viewer.component.html',
	styleUrls: ['./ea-history-viewer.component.css'],
	standalone: true,
	imports: [CommonModule, RouterModule, PrimeNgModules, NgxGraphModule, FormsModule],
	providers: [MessageService],
})
export class EaHistoryViewerComponent implements OnInit, OnChanges {
	@Input() eaId: number | null = null;
	@Input() asDialog: boolean = false;

	historyData: EaHistoryResponse | null = null;
	loading = false;
	error: string | undefined = undefined;

	// Graph data
	graphNodes: any[] = [];
	graphLinks: any[] = [];
	graphView: [number, number] = [1200, 800];
	curve: any = { type: 'curveBundle', bundlePadding: 0.2 };

	selectedEaDetails: EnumerationArea | null = null;
	loadingEaDetails = false;
	selectedNodeId: string | null = null;

	constructor(
		private route: ActivatedRoute,
		public router: Router,
		private enumerationAreaService: EnumerationAreaDataService,
		private messageService: MessageService,
		@Optional() public ref: DynamicDialogRef,
		@Optional() public config: DynamicDialogConfig
	) {}

	ngOnInit() {
		// If opened via DynamicDialog, get data from config
		if (this.config) {
			this.asDialog = this.config.data?.asDialog || true;
			this.eaId = this.config.data?.eaId || null;
		}
		
		// If not in dialog mode, get ID from route
		if (!this.asDialog) {
			this.route.params.subscribe((params) => {
				this.eaId = params['id'] ? +params['id'] : null;
				if (this.eaId) {
					this.loadHistory();
				}
			});
		} else if (this.eaId) {
			// If in dialog mode and ID is provided, load immediately
			this.loadHistory();
		}
	}

	ngOnChanges(changes: SimpleChanges) {
		// If eaId changes in dialog mode, reload history
		if (this.asDialog && changes['eaId'] && !changes['eaId'].firstChange && this.eaId) {
			this.loadHistory();
		}
	}

	loadHistory() {
		if (!this.eaId) return;

		this.loading = true;
		this.error = undefined;
		this.enumerationAreaService.getEaHistory(this.eaId).subscribe({
			next: (data) => {
				this.historyData = data;
				// Load current EA details with location hierarchy if not already included
				if (data.currentEa && (!data.currentEa.subAdministrativeZones || data.currentEa.subAdministrativeZones.length === 0)) {
					this.loadCurrentEaDetails();
				}
				// Build graph data
				this.buildGraphData(data);
				this.loading = false;
			},
			error: (error) => {
				console.error('Error loading history:', error);
				this.error = error.error?.message || 'Failed to load EA history';
				this.messageService.add({
					severity: 'error',
					summary: 'Error',
					detail: this.error,
					life: 5000,
				});
				this.loading = false;
			},
		});
	}

	getOperationTypeLabel(type: OperationType): string {
		return type === OperationType.SPLIT ? 'Split' : 'Merge';
	}

	getOperationTypeSeverity(type: OperationType): string {
		return type === OperationType.SPLIT ? 'info' : 'warning';
	}

	getOperationTypeIcon(type: OperationType): string {
		return type === OperationType.SPLIT ? 'pi-code-branch' : 'pi-objects-column';
	}

	formatDate(date: Date | string): string {
		if (!date) return 'N/A';
		const d = typeof date === 'string' ? new Date(date) : date;
		return d.toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
		});
	}

	loadCurrentEaDetails() {
		if (!this.historyData?.currentEa?.id) return;
		
		this.enumerationAreaService.findEnumerationAreaById(this.historyData.currentEa.id, false, true).subscribe({
			next: (ea: EnumerationArea) => {
				if (this.historyData) {
					this.historyData.currentEa = ea;
				}
			},
			error: (error) => {
				console.error('Error loading current EA details:', error);
			},
		});
	}

	viewEaDetails(id: number) {
		this.router.navigate(['/admin/data-view/eazone', id]);
	}

	buildGraphData(data: EaHistoryResponse) {
		const nodes: any[] = [];
		const links: any[] = [];
		const nodeMap = new Map<number, any>();
		let linkIdCounter = 0;

		// Add current EA as center node
		const currentEa = data.currentEa;
		const currentNode = {
			id: `ea-${currentEa.id}`,
			label: currentEa.name,
			data: {
				ea: currentEa,
				isCurrent: true,
				areaCode: currentEa.areaCode,
				isActive: currentEa.isActive,
			},
		};
		nodes.push(currentNode);
		nodeMap.set(currentEa.id, currentNode);

		// Process ancestors (parents)
		const processNode = (node: EaLineageNode, isAncestor: boolean = true) => {
			const nodeId = `ea-${node.ea.id}`;
			
			if (!nodeMap.has(node.ea.id)) {
				const graphNode = {
					id: nodeId,
					label: node.ea.name,
					dimension: { width: 150, height: 60 },
					data: {
						ea: node.ea,
						isCurrent: false,
						areaCode: node.ea.areaCode,
						isActive: node.ea.isActive,
						operation: node.operation,
					},
				};
				nodes.push(graphNode);
				nodeMap.set(node.ea.id, graphNode);
			}

			// Note: Links will be created in the recursive processing below
			// This ensures all nodes exist before creating links

			// Process parents recursively
			node.parents.forEach((parent) => {
				processNode(parent, isAncestor);
				const parentId = `ea-${parent.ea.id}`;
				const childId = nodeId;
				links.push({
					id: `link-${linkIdCounter++}`,
					source: parentId,
					target: childId,
					label: parent.operation ? this.getOperationTypeLabel(parent.operation.type) : '',
					data: {
						operation: parent.operation,
						type: parent.operation?.type,
					},
				});
			});

			// Process children recursively
			node.children.forEach((child) => {
				processNode(child, isAncestor);
				const parentId = nodeId;
				const childId = `ea-${child.ea.id}`;
				links.push({
					id: `link-${linkIdCounter++}`,
					source: parentId,
					target: childId,
					label: child.operation ? this.getOperationTypeLabel(child.operation.type) : '',
					data: {
						operation: child.operation,
						type: child.operation?.type,
					},
				});
			});
		};

		// Process ancestors and create links to current EA
		data.history.ancestors.forEach((ancestor) => {
			processNode(ancestor, true);
			// Create direct link from ancestor to current EA
			const ancestorId = `ea-${ancestor.ea.id}`;
			if (nodeMap.has(ancestor.ea.id) && nodeMap.has(currentEa.id)) {
				links.push({
					id: `link-ancestor-${ancestor.ea.id}-${linkIdCounter++}`,
					source: ancestorId,
					target: `ea-${currentEa.id}`,
					label: ancestor.operation ? this.getOperationTypeLabel(ancestor.operation.type) : 'Ancestor',
					data: {
						operation: ancestor.operation,
						type: ancestor.operation?.type || 'SPLIT',
					},
				});
			}
		});

		// Process descendants and create links from current EA
		data.history.descendants.forEach((descendant) => {
			processNode(descendant, false);
			// Create direct link from current EA to descendant
			const descendantId = `ea-${descendant.ea.id}`;
			if (nodeMap.has(currentEa.id) && nodeMap.has(descendant.ea.id)) {
				links.push({
					id: `link-descendant-${descendant.ea.id}-${linkIdCounter++}`,
					source: `ea-${currentEa.id}`,
					target: descendantId,
					label: descendant.operation ? this.getOperationTypeLabel(descendant.operation.type) : 'Descendant',
					data: {
						operation: descendant.operation,
						type: descendant.operation?.type || 'SPLIT',
					},
				});
			}
		});

		// Create new arrays to trigger change detection
		this.graphNodes = [...nodes];
		this.graphLinks = [...links];
		
		console.log('Graph Nodes:', this.graphNodes.length, this.graphNodes);
		console.log('Graph Links:', this.graphLinks.length, this.graphLinks);
	}

	onNodeClick(node: any, event: MouseEvent) {
		event.stopPropagation(); // Prevent event bubbling
		
		// Extract EA ID from node data or node ID
		let eaId: number | null = null;
		let nodeId: string | null = null;
		
		if (node?.data?.ea?.id) {
			eaId = node.data.ea.id;
			nodeId = node.id;
		} else if (node?.id) {
			// Try to extract ID from node ID format "ea-{id}"
			const idMatch = node.id.toString().match(/^ea-(\d+)$/);
			if (idMatch) {
				eaId = parseInt(idMatch[1], 10);
				nodeId = node.id;
			}
		}
		
		if (eaId && nodeId) {
			// Set selected node ID to add border
			this.selectedNodeId = nodeId;
			this.loadEaDetails(eaId);
		}
	}

	loadEaDetails(eaId: number) {
		this.loadingEaDetails = true;
		
		// Fetch EA with location details (includeSubAdminZone=true to get SAZ, which includes AZ and Dzongkhag)
		this.enumerationAreaService.findEnumerationAreaById(eaId, false, true).subscribe({
			next: (ea: EnumerationArea) => {
				this.selectedEaDetails = ea;
				this.loadingEaDetails = false;
			},
			error: (error) => {
				console.error('Error loading EA details:', error);
				this.messageService.add({
					severity: 'error',
					summary: 'Error',
					detail: 'Failed to load enumeration area details',
					life: 3000,
				});
				this.loadingEaDetails = false;
			},
		});
	}

	getNodeColor(node: any): string {
		// Use muted slate colors for consistency
		if (node.data?.isCurrent) {
			return '#475569'; // Darker slate for current EA
		}
		if (node.data?.operation) {
			// Subtle differences for operation types
			return node.data.operation.type === 'SPLIT' ? '#64748b' : '#64748b'; // Same muted color for both
		}
		return '#94a3b8'; // Lighter slate for others
	}

	isNodeSelected(node: any): boolean {
		return this.selectedNodeId === node.id;
	}
}

