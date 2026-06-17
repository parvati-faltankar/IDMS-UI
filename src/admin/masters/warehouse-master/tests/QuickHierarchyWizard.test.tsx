import { describe, expect, it } from 'vitest';
import {
  buildQuickPreviewFingerprint,
  buildQuickPreviewTree,
  isQuickPreviewInvalidated,
} from '../components/QuickHierarchyWizard';
import type { QuickHierarchyPreviewInput, QuickHierarchyPreviewResult } from '../types/warehouse.dto';

function makeInput(overrides?: Partial<QuickHierarchyPreviewInput>): QuickHierarchyPreviewInput {
  return {
    warehouseId: 'WH-TEST',
    patternKey: 'standard-distribution',
    templateAction: 'create-from-pattern',
    activateTemplateOnCommit: true,
    countsByLevel: { ZONE: 1, AISLE: 1, RACK: 1, BIN: 1 },
    codingByLevel: [
      { levelCode: 'ZONE', codePrefix: 'Z', startSequence: 1, sequenceLength: 2, separator: '', suffix: '' },
      { levelCode: 'AISLE', codePrefix: 'A', startSequence: 1, sequenceLength: 2, separator: '', suffix: '' },
      { levelCode: 'RACK', codePrefix: 'R', startSequence: 1, sequenceLength: 2, separator: '', suffix: '' },
      { levelCode: 'BIN', codePrefix: 'B', startSequence: 1, sequenceLength: 2, separator: '', suffix: '' },
    ],
    defaults: {
      status: 'Draft',
      capacityApplicable: true,
      itemEligibilityApplicable: true,
      responsibilityApplicable: true,
      barcodeApplicable: false,
      qrApplicable: false,
      capacityEnforcementMode: 'None',
      defaultResponsibilityRole: 'AreaSupervisor',
    },
    permissionGranted: true,
    ...overrides,
  };
}

function makePreview(): QuickHierarchyPreviewResult {
  return {
    previewToken: 'QPREV-1',
    warehouseId: 'WH-TEST',
    patternKey: 'standard-distribution',
    rows: [
      {
        tempNodeId: 'TMP-Z',
        level: 1,
        levelCode: 'ZONE',
        levelName: 'Zone',
        parentCode: 'WH-TEST',
        nodeCode: 'Z01',
        nodeName: 'Zone 01',
        locationType: 'Zone',
        levelRole: 'Structural',
        fullLocationIdentifier: 'WH-TEST-Z01',
        leafEndpointPreview: false,
        inventoryEndpointEligible: false,
        capacityApplicable: false,
        itemEligibilityApplicable: false,
        responsibilityApplicable: true,
        barcodeApplicable: 'Not Applicable',
        qrApplicable: 'Not Applicable',
        transactionPurposes: 'Not Applicable',
        capacityEnforcementMode: 'Not Applicable',
        defaultResponsibilityRole: 'AreaSupervisor',
        status: 'Draft',
        validationStatus: 'Valid',
      },
      {
        tempNodeId: 'TMP-A',
        parentTempNodeId: 'TMP-Z',
        level: 2,
        levelCode: 'AISLE',
        levelName: 'Aisle',
        parentCode: 'Z01',
        nodeCode: 'A01',
        nodeName: 'Aisle 01',
        locationType: 'Aisle',
        levelRole: 'Structural',
        fullLocationIdentifier: 'WH-TEST-Z01-A01',
        leafEndpointPreview: false,
        inventoryEndpointEligible: false,
        capacityApplicable: false,
        itemEligibilityApplicable: false,
        responsibilityApplicable: true,
        barcodeApplicable: 'Not Applicable',
        qrApplicable: 'Not Applicable',
        transactionPurposes: 'Not Applicable',
        capacityEnforcementMode: 'Not Applicable',
        defaultResponsibilityRole: 'AreaSupervisor',
        status: 'Draft',
        validationStatus: 'Valid',
      },
      {
        tempNodeId: 'TMP-R',
        parentTempNodeId: 'TMP-A',
        level: 3,
        levelCode: 'RACK',
        levelName: 'Rack',
        parentCode: 'A01',
        nodeCode: 'R01',
        nodeName: 'Rack 01',
        locationType: 'Rack',
        levelRole: 'Structural',
        fullLocationIdentifier: 'WH-TEST-Z01-A01-R01',
        leafEndpointPreview: false,
        inventoryEndpointEligible: false,
        capacityApplicable: false,
        itemEligibilityApplicable: false,
        responsibilityApplicable: true,
        barcodeApplicable: 'Not Applicable',
        qrApplicable: 'Not Applicable',
        transactionPurposes: 'Not Applicable',
        capacityEnforcementMode: 'Not Applicable',
        defaultResponsibilityRole: 'AreaSupervisor',
        status: 'Draft',
        validationStatus: 'Valid',
      },
      {
        tempNodeId: 'TMP-B',
        parentTempNodeId: 'TMP-R',
        level: 4,
        levelCode: 'BIN',
        levelName: 'Bin',
        parentCode: 'R01',
        nodeCode: 'B01',
        nodeName: 'Bin 01',
        locationType: 'BIN',
        levelRole: 'InventoryEndpoint',
        fullLocationIdentifier: 'WH-TEST-Z01-A01-R01-B01',
        leafEndpointPreview: true,
        inventoryEndpointEligible: true,
        capacityApplicable: true,
        itemEligibilityApplicable: true,
        responsibilityApplicable: true,
        barcodeApplicable: false,
        qrApplicable: false,
        transactionPurposes: ['Storage'],
        capacityEnforcementMode: 'None',
        defaultResponsibilityRole: 'AreaSupervisor',
        status: 'Draft',
        validationStatus: 'Valid',
      },
    ],
    totalGeneratedNodes: 4,
    conflictCount: 0,
    validCount: 4,
    generatedAt: '2026-06-08T00:00:00.000Z',
    paramsHash: 'H123',
    warnings: [],
  };
}

describe('QuickHierarchyWizard helpers', () => {
  it('invalidates preview when coding field changes', () => {
    const baseline = makeInput();
    const baselineFingerprint = buildQuickPreviewFingerprint(baseline);
    const changed = makeInput({
      codingByLevel: baseline.codingByLevel.map((item) =>
        item.levelCode === 'BIN' ? { ...item, codePrefix: 'BX' } : item,
      ),
    });
    expect(isQuickPreviewInvalidated(baselineFingerprint, changed)).toBe(true);
  });

  it('invalidates preview when defaults change', () => {
    const baseline = makeInput();
    const baselineFingerprint = buildQuickPreviewFingerprint(baseline);
    const changed = makeInput({ defaults: { ...baseline.defaults, barcodeApplicable: true } });
    expect(isQuickPreviewInvalidated(baselineFingerprint, changed)).toBe(true);
  });

  it('builds tree preview for standard distribution chain', () => {
    const tree = buildQuickPreviewTree(makePreview().rows);
    expect(tree.get('ROOT')?.[0].nodeCode).toBe('Z01');
    expect(tree.get('TMP-Z')?.[0].nodeCode).toBe('A01');
    expect(tree.get('TMP-A')?.[0].nodeCode).toBe('R01');
    expect(tree.get('TMP-R')?.[0].nodeCode).toBe('B01');
  });

  it('produces stable fingerprint for unchanged input', () => {
    const input = makeInput();
    expect(buildQuickPreviewFingerprint(input)).toBe(buildQuickPreviewFingerprint(input));
  });
});
