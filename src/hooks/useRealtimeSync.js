import { useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

export const useRealtimeSync = (tableName, onUpdate, onInsert, onDelete) => {
  const subscriptionRef = useRef(null);

  useEffect(() => {
    // Suscribirse a cambios en tiempo real
    const subscribeToRealtime = () => {
      try {
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
          .subscribe((status) => {
            console.log('Estado de suscripción:', status);
            if (status === 'SUBSCRIBED') {
              console.log('Suscripción exitosa a', tableName);
            } else if (status === 'CHANNEL_ERROR') {
              console.error('Error en canal de', tableName);
              toast.error(`Error de conexión con ${tableName}`);
            }
          });

        subscriptionRef.current = subscription;
      } catch (error) {
        console.error('Error al suscribirse a cambios en tiempo real:', error);
        toast.error('Error de sincronización en tiempo real');
      }
    };

    subscribeToRealtime();

    // Cleanup al desmontar
    return () => {
      if (subscriptionRef.current) {
        try {
          supabase.removeChannel(subscriptionRef.current);
        } catch (error) {
          console.error('Error al limpiar suscripción:', error);
        }
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
