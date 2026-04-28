/**
 * Menu Builder Page Wrapper
 * Located in pages directory for consistency with project structure
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MenuBuilderPage } from '../../components/common/MenuBuilder';

interface MenuBuilderPageWrapperProps {
  onNavigateToPurchaseRequisitionList: () => void;
}

const MenuBuilderPageWrapper: React.FC<MenuBuilderPageWrapperProps> = ({ onNavigateToPurchaseRequisitionList }) => {
  const navigate = useNavigate();

  return (
    <MenuBuilderPage
      onBack={() => navigate(-1)}
    />
  );
};

export default MenuBuilderPageWrapper;
