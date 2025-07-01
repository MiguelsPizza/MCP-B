import { useLiveQuery } from '@tanstack/react-db';
import { AlertCircle, CheckCircle2, Circle, ListTodo } from 'lucide-react';
import { useTodoSortParamsRouter } from '../hooks/useTodoSortParamsRouter';
import { userId } from '../lib/utils';
import { userTodoCollection } from '../services/collections';
import { Alert, AlertDescription } from './ui/alert';
import { Checkbox } from './ui/checkbox';
import { Skeleton } from './ui/skeleton';

export default function Todos({ route }: { route: '/assistant' | '/blogs' }) {
  const { sortParams, getSortDescription } = useTodoSortParamsRouter(route);
  const { data: todos = [] } = useLiveQuery(
    (query) => {
      let baseQuery = query.from({ userTodoCollection });

      // if (sortParams.completed !== undefined) {
      //     baseQuery = baseQuery.where('@userTodoCollection.completed', '=', sortParams.completed);
      // }

      if (sortParams.search) {
        baseQuery = baseQuery.where('@userTodoCollection.text', 'like', `%${sortParams.search}%`);
      }

      const sortOrder = sortParams.sortOrder === 'desc' ? 'desc' : 'asc';
      baseQuery = baseQuery.orderBy({
        [`@userTodoCollection.${sortParams.sortBy}`]: sortOrder,
      } as any);

      return baseQuery
        .keyBy('@id')
        .select(
          '@userTodoCollection.id',
          '@userTodoCollection.text',
          '@userTodoCollection.completed',
          '@userTodoCollection.userId',
          '@userTodoCollection.created_at',
          '@userTodoCollection.updated_at'
        );
    },
    [userTodoCollection, sortParams]
  );

  const isLoading = false;
  const error: Error | null = null;
  const isMutating = false;

  if (isLoading) {
    return (
      <div className="h-full p-3 sm:p-4 space-y-3">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="flex items-start gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg bg-card/50 border border-border/50"
          >
            <Skeleton className="h-4 w-4 sm:h-5 sm:w-5 rounded-full mt-0.5" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full p-3 sm:p-4 flex items-center justify-center">
        <Alert variant="destructive" className="border-destructive/50">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{(error as Error)?.message || 'Failed to load todos'}</AlertDescription>
        </Alert>
      </div>
    );
  }

  const completedCount = todos.filter((t) => t.completed).length;
  const totalCount = todos.length;

  return (
    <div className="h-full flex flex-col">
      {/* Header Stats */}
      <div className="px-3 sm:px-4 py-2 sm:py-3 border-b bg-muted/30">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <ListTodo className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
            </div>
            <div>
              <p className="text-xs sm:text-sm font-medium">
                {totalCount === 0 ? 'No tasks' : `${completedCount} of ${totalCount} completed`}
              </p>
              <p className="text-[10px] sm:text-xs text-muted-foreground">{getSortDescription()}</p>
            </div>
          </div>
          {isMutating && (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          )}
        </div>
        {totalCount > 0 && (
          <div className="w-full bg-muted rounded-full h-1.5 sm:h-2 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary to-primary/80 transition-all duration-500"
              style={{ width: `${(completedCount / totalCount) * 100}%` }}
            />
          </div>
        )}
      </div>

      {/* Todo List */}
      <div className="flex-1 overflow-auto p-3 sm:p-4">
        {todos.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 sm:p-8">
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-muted flex items-center justify-center mb-3 sm:mb-4">
              <CheckCircle2 className="w-6 h-6 sm:w-8 sm:h-8 text-muted-foreground" />
            </div>
            <p className="text-xs sm:text-sm font-medium mb-1">All caught up!</p>
            <p className="text-[10px] sm:text-xs text-muted-foreground">No tasks to display</p>
          </div>
        ) : (
          <div className="space-y-1.5 sm:space-y-2">
            {todos.map((todo, index) => (
              <div
                key={todo.id}
                className={`
                  group flex items-start gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg
                  bg-card/50 backdrop-blur-sm border border-border/50
                  transition-all duration-200 hover:bg-card/80 hover:border-border
                  hover:shadow-sm animate-in fade-in-50 slide-in-from-bottom-1
                `}
                style={{
                  animationDelay: `${Math.min(index * 50, 500)}ms`,
                  animationFillMode: 'both',
                }}
              >
                <div className="mt-0.5 flex-shrink-0">
                  {todo.completed ? (
                    <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                  ) : (
                    <Circle className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-xs sm:text-sm leading-relaxed break-words ${
                      todo.completed ? 'text-muted-foreground line-through' : 'text-foreground'
                    }`}
                  >
                    {todo.text}
                  </p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1">
                    {new Date(todo.created_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
