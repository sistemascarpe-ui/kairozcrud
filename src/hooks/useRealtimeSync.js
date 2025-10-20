import { useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

export const useRealtimeSync = (tableName, onUpdate, onInsert, onDelete) => {
  const subscriptionRef = useRef(null);

  useEffect(() => {
    // Suscribirse a cambios en tiempo real
    const subscribeToRealtime = () => {
      const subscription = supabase
        .channel(`${tableName}_changes`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: tableName
          },
          (payload) => {
            console.log('Cambio detectado en', tableName, ':', payload);
            
            // Mostrar notificación de cambio
            toast.success(`Cambios detectados en ${tableName}`, {
              duration: 3000,
              position: 'top-right'
            });

            // Ejecutar callbacks según el tipo de evento
            switch (payload.eventType) {
              case 'INSERT':
                onInsert?.(payload.new);
                break;
              case 'UPDATE':
                onUpdate?.(payload.new, payload.old);
                break;
              case 'DELETE':
                onDelete?.(payload.old);
                break;
              default:
                break;
            }
          }
        )
        .subscribe();

      subscriptionRef.current = subscription;
    };

    subscribeToRealtime();

    // Cleanup al desmontar
    return () => {
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current);
      }
    };
  }, [tableName, onUpdate, onInsert, onDelete]);

  return {
    unsubscribe: () => {
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current);
      }
    }
  };
};
