import { useContext } from 'react';
import {
  ScheduleProposalContext,
  ScheduleProposalContextValue,
} from '../context/ScheduleProposalContext';

/** Rythme proposé à valider (ScheduleProposalProvider). */
export function useScheduleProposal(): ScheduleProposalContextValue {
  const value = useContext(ScheduleProposalContext);
  if (!value) {
    throw new Error(
      'useScheduleProposal doit être utilisé dans un ScheduleProposalProvider.',
    );
  }
  return value;
}
