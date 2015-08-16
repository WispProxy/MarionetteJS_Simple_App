/*******************
 *  Import part
 *******************/
//= ../../bower_components/jquery/dist/jquery.js
//= ../../bower_components/underscore/underscore.js
//= ../../bower_components/backbone/backbone.js

//= ../../bower_components/backbone.localstorage/backbone.localStorage.js

//= ../../bower_components/marionette/lib/backbone.marionette.js



/*******************
 *  Project part
 *******************/
'use strict';

/*****
 *  Init project!
 ****/
	var UserTracker = new Backbone.Marionette.Application();

/*****
 * Init Model & Collection!
 ****/
	var User        = Backbone.Model.extend({});
	var Users       = Backbone.Collection.extend({
		model:          User,
		localStorage:   new Backbone.LocalStorage('UserTrackerCollection')
	});

/*****
 *  Init View!
 ****/
/**
 * Init one item!
 */
	var UserView    = Backbone.Marionette.ItemView.extend({
		template:    '#userView'
	});
	var NoUsersView = Backbone.Marionette.ItemView.extend({
		template:    '#noUsersView'
	});
/**
 * Init collection!
 */
	var UsersView   = Backbone.Marionette.CollectionView.extend({
		childView:    UserView,
		emptyView:   NoUsersView
	});
/**
 * Init form =)
 */
	var FormView    = Backbone.Marionette.ItemView.extend({
		/**
		 * Create template
		 */
		template:    '#formView',
		/**
		 * Add event
		 */
		events: {
			'click #createUser':            'onCreateNewUser',
			'click #clearAllLocalStorage':  'onClearAllLocalStorage'
		},
		/**
		 * Create UI
		 */
		ui: {
			name:    '#name',
			age:     '#age'
		},
		/**
		 * Create event functions
		 */
		onCreateNewUser: function ()
		{
			/**
			 * Add collection =)
			 */
			this.collection.add(
				{
					name:   this.ui.name.val(),
					age:    this.ui.age.val()
				},
				function (_Users)
				{
					_Users.save();
				}
			);

			/**
			 * Save to localStorage
			 *
			 * TODO: Experimental!
			 */
			this.collection.each(
				function (_Users)
				{
					_Users.save();
				}
			);

			/**
			 * Reset all values
			 * & Create empty values
			 */
			this.ui.name.val('');
			this.ui.age.val('');
		},
		onClearAllLocalStorage: function ()
		{
			/**
			 * Clear localStorage
			 */
			window.localStorage.clear();
		}
	});
/**
 * Add Regions for init View objects
 */
UserTracker.addRegions({
	form: '#form',
	list: '#list'
});







/*****
 *  Initialize!
 ****/
UserTracker.addInitializer(
	function ()
	{
		UserTracker.users   = new Users();

		UserTracker.form.show(
			new FormView({
				collection: UserTracker.users
			})
		);
		UserTracker.list.show(
			new UsersView({
				collection: UserTracker.users
			})
		);
	}
);
/**
 * Start Application =)
 */
UserTracker.start();
