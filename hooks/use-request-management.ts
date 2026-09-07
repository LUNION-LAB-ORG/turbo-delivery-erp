'use client';

import { useOuverture } from '@/hooks/use-ouverture';
import { useState } from 'react';
import { LeaveRequest, IEmployee } from '@/features/personnel/types/types';
import { useAjouterCongeMutation, useSupprimerCongeMutation, useModifierCongeMutation, useApprouverCongeMutation, useRejeterCongeMutation } from '@/features/conge/mutations/conge.mutation';
import { CongeType, DurationType } from '@/features/conge/types/conge.type';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export const useRequestManagement = (employees: IEmployee[]) => {
  const queryClient = useQueryClient();
  
  // Mutations
  const ajouterCongeMutation = useAjouterCongeMutation();
  const supprimerCongeMutation = useSupprimerCongeMutation();
  const modifierCongeMutation = useModifierCongeMutation();
  const approuverCongeMutation = useApprouverCongeMutation();
  const rejeterCongeMutation = useRejeterCongeMutation();

  // Modal states
  const { isOpen: isFormOpen, onClose: onFormClose, onOpen: onFormOpen } = useOuverture();
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingRequestId, setEditingRequestId] = useState<string | null>(null);
  const [editingRequest, setEditingRequest] = useState<Partial<LeaveRequest>>({});

  /*
   * `onOpenChange` de la v2 etait une BASCULE sans argument : ce wrapper l'appelait dans
   * la branche « fermer », en comptant sur le fait que la fenetre etait ouverte a ce
   * moment-la. Fermer s'appelle fermer.
   */
  const handleFormOpenChange = (open: boolean) => {
    if (open) onFormOpen();
    else onFormClose();
  };

  const mapTypeToEnum = (type: string): CongeType => {
    switch(type) {
      case 'annuel':
      case 'ANNUEL':
        return CongeType.ANNUEL;
      case 'maladie':
      case 'MALADIE':
        return CongeType.MALADIE;
      case 'MATERNITE':
        return CongeType.MATERNITE;
      default:
        return CongeType.SANS_SOLDE;
    }
  };

  const mapDurationTypeToEnum = (durationType: string): DurationType => {
    switch(durationType) {
      case 'mois':
        return DurationType.MOIS;
      case 'quinzaine':
        return DurationType.QUINZAINE;
      case 'semaine':
        return DurationType.SEMAINE;
      default:
        return DurationType.PERSONNALISE;
    }
  };

  const calculateDuration = (startDate: string, endDate: string): number => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return Math.max(1, diffDays);
  };

  const handleSubmitRequest = (requestData: any) => {
    console.log("🔍 handleSubmitRequest - requestData reçu:", requestData);
    const employee = employees.find((emp: IEmployee) => emp.id === requestData.employeeId);
    console.log("🔍 handleSubmitRequest - employee trouvé:", employee);

    // Validation pour s'assurer que employeeId n'est pas vide
    if (!requestData.employeeId || requestData.employeeId.trim() === '') {
      console.error("❌ Erreur: employeeId est vide ou null");
      return;
    }

    const congeData = {
      employeeId: requestData.employeeId,
      employeeName: employee?.name || '',
      type: mapTypeToEnum(requestData.type),
      startDate: requestData.startDate,
      endDate: requestData.endDate,
      duration: calculateDuration(requestData.startDate, requestData.endDate),
      durationType: mapDurationTypeToEnum(requestData.durationType),
      reason: requestData.reason,
      statut: 'EN_ATTENTE'
    };

    if (isEditMode && editingRequestId) {
      // Validation pour s'assurer que employeeId n'est pas vide
      if (!requestData.employeeId || requestData.employeeId.trim() === '') {
        console.error("❌ Erreur: employeeId est vide ou null en mode édition");
        return;
      }

      const updateData = {
        employeeId: requestData.employeeId,
        employeeName: employee?.name || requestData.employeeName || '',
        type: mapTypeToEnum(requestData.type),
        startDate: requestData.startDate,
        endDate: requestData.endDate,
        duration: calculateDuration(requestData.startDate, requestData.endDate),
        durationType: mapDurationTypeToEnum(requestData.durationType),
        reason: requestData.reason,
        statut: requestData.statut === 'APPROUVEE' ? 'EN_COURS' : requestData.statut
      };

      console.log("🔍 handleSubmitRequest - updateData pour modification:", updateData);
      modifierCongeMutation.mutate({ id: editingRequestId, data: updateData }, {
        onSuccess: (data) => {
          console.log('✅ Succès - Données modifiées:', data);
          toast.success('Demande de congé modifiée avec succès');
          queryClient.invalidateQueries({ queryKey: ['conges'] });
          queryClient.invalidateQueries({ queryKey: ['statistiques-conges'] }); // Corriger la clé des stats
        }
      });
    } else {
      ajouterCongeMutation.mutate(congeData, {
        onSuccess: (data) => {
          console.log('✅ Succès - Données sauvegardées:', data);
          toast.success('Demande de congé créée avec succès');
          queryClient.invalidateQueries({ queryKey: ['conges'] });
          queryClient.invalidateQueries({ queryKey: ['statistiques-conges'] }); // Corriger la clé des stats
        }
      });
    }

    setIsEditMode(false);
    setEditingRequestId(null);
    handleFormOpenChange(false);
  };

  const handleDeleteRequest = (requestId: string) => {
    supprimerCongeMutation.mutate(requestId, {
      onSuccess: (data) => {
        console.log('✅ Succès - Congé supprimé:', data);
        toast.success('Congé supprimé avec succès');
        queryClient.invalidateQueries({ queryKey: ['conges'] });
        queryClient.invalidateQueries({ queryKey: ['statistiques-conges'] }); // Corriger la clé des stats
      }
    });
  };

  const handleApproveRequest = (requestId: string) => {
    approuverCongeMutation.mutate({
      id: requestId,
      data: { reason: 'Approuvé automatiquement' }
    }, {
      onSuccess: (data) => {
        console.log('✅ Succès - Congé approuvé:', data);
        toast.success('Congé approuvé avec succès');
        queryClient.invalidateQueries({ queryKey: ['conges'] });
        queryClient.invalidateQueries({ queryKey: ['statistiques-conges'] }); // Corriger la clé des stats
      }
    });
  };

  const handleRejectRequest = (requestId: string) => {
    rejeterCongeMutation.mutate({
      id: requestId,
      data: { reason: 'Rejeté automatiquement' }
    }, {
      onSuccess: (data) => {
        console.log('✅ Succès - Congé rejeté:', data);
        toast.success('Congé rejeté avec succès');
        queryClient.invalidateQueries({ queryKey: ['conges'] });
        queryClient.invalidateQueries({ queryKey: ['statistiques-conges'] }); // Corriger la clé des stats
      }
    });
  };

  const handleEditRequest = (request: LeaveRequest) => {
    console.log("🔍 handleEditRequest - request reçu:", request);
    setIsEditMode(true);
    setEditingRequestId(request.id);
    setEditingRequest(request); // Ajouter cette ligne pour pré-remplir le formulaire
    console.log("🔍 handleEditRequest - editingRequest mis à jour:", request);
    onFormOpen();
  };

  const handleNewRequest = () => {
    setIsEditMode(false);
    setEditingRequestId(null);
    setEditingRequest({}); // Réinitialiser editingRequest
    onFormOpen();
  };

  return {
    // Modal states
    isFormOpen,
    onOpenChange: handleFormOpenChange,
    isEditMode,
    editingRequestId,
    editingRequest,

    // Actions
    handleSubmitRequest,
    handleDeleteRequest,
    handleApproveRequest,
    handleRejectRequest,
    handleEditRequest,
    handleNewRequest,
    
    // Utilities
    calculateDuration
  };
};
