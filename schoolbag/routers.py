class SchoolbagDBRouter(object):
    APPS = ('accounts', 'homeworks', 'lessons', 'jobs', 'schools',)

    def db_for_read(self, model, **hints):
        if model._meta.app_label in self.APPS:
            return 'schoolbag'

        return None

    def db_for_write(self, model, **hints):
        if model._meta.app_label in self.APPS:
            return 'schoolbag'

        return None

    def allow_syncdb(self, db, model):
        if db == 'schoolbag':
            return model._meta.app_label in APPS
        elif model._meta.app_label in self.APPS:
            return False
        return None